import { createApp } from "./app.js";
import { connectDatabase } from "./db.js";
const database = await connectDatabase();
let app;
try {
  app = createApp({ db: database.store, jwtSecret: process.env.JWT_SECRET });
} catch (error) {
  await database.close();
  throw error;
}
const server = app.listen(process.env.PORT || 3000, "127.0.0.1", () =>
  console.log(
    `CRM API (MongoDB): http://localhost:${process.env.PORT || 3000}`,
  ),
);
server.on("error", async (error) => {
  console.error(error.code);
  await database.close();
  process.exit(1);
});
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => {
    server.close(async () => {
      await database.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  });
