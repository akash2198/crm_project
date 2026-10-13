import { connectDatabase } from "./db.js";
const database = await connectDatabase();
console.log("MongoDB collections and indexes ready");
await database.close();
