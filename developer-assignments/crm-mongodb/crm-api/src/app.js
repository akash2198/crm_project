import express from "express";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";

const email = z.string().trim().toLowerCase().email().max(254);
const password = z
  .string()
  .min(8)
  .max(72)
  .refine(
    (v) => Buffer.byteLength(v, "utf8") <= 72,
    "Password must be at most 72 bytes",
  );
const register = z
  .object({ name: z.string().trim().min(1).max(120), email, password })
  .strict();
const login = z.object({ email, password }).strict();
const enquiry = z
  .object({
    name: z.string().trim().min(1).max(120),
    email,
    courseInterest: z.string().trim().min(1).max(160),
    phone: z.string().trim().max(30).optional(),
    message: z.string().trim().max(2000).optional(),
  })
  .strict();
const pagination = z
  .object({
    page: z.coerce.number().int().min(1).max(100000).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();
const failure = (res, status, message) =>
  res.status(status).json({ error: { message } });

export function createApp({ db, jwtSecret, rateLimits = true }) {
  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.startsWith("replace-"))
    throw new Error("Set a random JWT_SECRET of at least 32 characters");
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet(), express.json({ limit: "16kb" }));
  const limiter = (limit) =>
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      handler: (_req, res) =>
        failure(res, 429, "Too many requests; try again later"),
    });
  if (rateLimits) {
    app.use("/api/auth", limiter(30));
    app.use("/api/enquiries", limiter(200));
  }
  const token = (user) =>
    jwt.sign({}, jwtSecret, {
      algorithm: "HS256",
      subject: user.id,
      issuer: "counselor-crm",
      audience: "crm-api",
      expiresIn: "1h",
    });
  async function auth(req, res, next) {
    const match = /^Bearer (\S+)$/.exec(req.headers.authorization || "");
    if (!match) return failure(res, 401, "Valid bearer token required");
    let payload;
    try {
      payload = jwt.verify(match[1], jwtSecret, {
        algorithms: ["HS256"],
        issuer: "counselor-crm",
        audience: "crm-api",
      });
    } catch {
      return failure(res, 401, "Invalid or expired token");
    }
    if (!z.uuid().safeParse(payload.sub).success)
      return failure(res, 401, "Invalid token subject");
    const employee = await db.findEmployeeById(payload.sub);
    if (!employee) return failure(res, 401, "Account no longer exists");
    req.user = { id: employee.id, name: employee.name, email: employee.email };
    next();
  }
  app.get("/health", async (_req, res) => {
    await db.ping();
    res.json({ status: "ok" });
  });
  app.post("/api/auth/register", async (req, res) => {
    const data = register.parse(req.body);
    const hash = await bcrypt.hash(data.password, 12);
    const employee = await db.createEmployee({
      name: data.name,
      email: data.email,
      passwordHash: hash,
    });
    const publicEmployee = {
      id: employee.id,
      name: employee.name,
      email: employee.email,
    };
    res
      .status(201)
      .json({
        employee: publicEmployee,
        token: token(employee),
        expiresIn: 3600,
      });
  });
  app.post("/api/auth/login", async (req, res) => {
    const data = login.parse(req.body);
    const employee = await db.findEmployeeByEmail(data.email);
    // Perform a hash comparison even for missing accounts to reduce timing differences.
    const hash =
      employee?.passwordHash ||
      "$2b$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW";
    const valid = await bcrypt.compare(data.password, hash);
    if (!employee || !valid)
      return failure(res, 401, "Invalid email or password");
    const { id, name, email } = employee;
    res.json({
      employee: { id, name, email },
      token: token(employee),
      expiresIn: 3600,
    });
  });
  app.get("/api/auth/me", auth, (req, res) => res.json({ employee: req.user }));
  app.post("/api/enquiries", async (req, res) => {
    const data = enquiry.parse(req.body);
    const created = await db.createEnquiry(data);
    res
      .status(201)
      .json({
        enquiry: { id: created.id, createdAt: created.createdAt },
        message: "Enquiry received",
      });
  });
  for (const scope of ["unclaimed", "mine"]) {
    app.get(`/api/enquiries/${scope}`, auth, async (req, res) => {
      const { page, limit } = pagination.parse(req.query);
      const enquiries = await db.listEnquiries({
        owner: scope === "mine" ? req.user.id : null,
        page,
        limit,
      });
      res.json({ enquiries, page, limit });
    });
  }
  app.post("/api/enquiries/:id/claim", auth, async (req, res) => {
    const id = z.uuid().parse(req.params.id);
    // MongoDB matches and updates a single document atomically.
    const claimed = await db.claimEnquiry(id, req.user.id);
    if (!claimed)
      return failure(res, 409, "Enquiry is unavailable or already claimed");
    res.json({ enquiry: claimed });
  });
  app.use((_req, res) => failure(res, 404, "Route not found"));
  app.use((err, _req, res, _next) => {
    if (err instanceof z.ZodError)
      return res.status(400).json({
        error: {
          message: "Validation failed",
          issues: err.issues.map(({ path, message }) => ({
            path: path.join("."),
            message,
          })),
        },
      });
    if (err.code === 11000)
      return failure(res, 409, "Email already registered");
    if (err.type === "entity.parse.failed")
      return failure(res, 400, "Invalid JSON");
    if (err.type === "entity.too.large")
      return failure(res, 413, "Request body too large");
    console.error("Request failed:", err.code || err.name);
    return failure(res, 500, "Internal server error");
  });
  return app;
}
