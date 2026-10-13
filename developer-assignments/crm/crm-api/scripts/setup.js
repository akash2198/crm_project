import { randomBytes } from "node:crypto";
import { readFile, writeFile, appendFile } from "node:fs/promises";
const file = new URL("../.env", import.meta.url);
const mongoLine =
  "MONGODB_URI=mongodb://crm:crm_local_password@127.0.0.1:27017/crm?authSource=admin";
try {
  await writeFile(
    file,
    `PORT=3000\n${mongoLine}\nJWT_SECRET=${randomBytes(48).toString("hex")}\n`,
    { flag: "wx", mode: 0o600 },
  );
  console.log("Created .env with MongoDB connection and a random JWT secret.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  const existing = await readFile(file, "utf8");
  if (!/^\s*(?:export\s+)?MONGODB_URI\s*=/m.test(existing)) {
    await appendFile(file, `\n${mongoLine}\n`);
    console.log(
      "Added MongoDB connection to .env; existing settings and JWT secret preserved.",
    );
  } else console.log(".env already has MONGODB_URI; left unchanged.");
}
