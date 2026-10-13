import { MongoClient } from "mongodb";
import { randomUUID } from "node:crypto";

const publicDocument = (document) => {
  if (!document) return null;
  const { _id, ...fields } = document;
  return { id: _id, ...fields };
};

export function createStore(database) {
  const employees = database.collection("employees");
  const enquiries = database.collection("enquiries");
  return {
    async initialize() {
      await employees.createIndex({ email: 1 }, { unique: true });
      await enquiries.createIndex({ claimedBy: 1, createdAt: -1, _id: 1 });
    },
    ping: () => database.command({ ping: 1 }),
    async findEmployeeById(id) {
      return publicDocument(await employees.findOne({ _id: id }));
    },
    async findEmployeeByEmail(email) {
      return publicDocument(await employees.findOne({ email }));
    },
    async createEmployee(data) {
      const employee = { _id: randomUUID(), ...data, createdAt: new Date() };
      await employees.insertOne(employee);
      return publicDocument(employee);
    },
    async createEnquiry(data) {
      const enquiry = {
        _id: randomUUID(),
        name: data.name,
        email: data.email,
        courseInterest: data.courseInterest,
        phone: data.phone || null,
        message: data.message || null,
        claimedBy: null,
        claimedAt: null,
        createdAt: new Date(),
      };
      await enquiries.insertOne(enquiry);
      return publicDocument(enquiry);
    },
    async listEnquiries({ owner, page, limit }) {
      const documents = await enquiries
        .find({ claimedBy: owner })
        .sort({ createdAt: -1, _id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray();
      return documents.map(publicDocument);
    },
    async claimEnquiry(id, employeeId) {
      return publicDocument(
        await enquiries.findOneAndUpdate(
          { _id: id, claimedBy: null },
          { $set: { claimedBy: employeeId, claimedAt: new Date() } },
          { returnDocument: "after", includeResultMetadata: false },
        ),
      );
    },
  };
}

export async function connectDatabase() {
  if (!process.env.MONGODB_URI)
    throw new Error("MONGODB_URI is required; run node scripts/setup.js");
  const client = new MongoClient(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
  try {
    await client.connect();
    const store = createStore(client.db());
    await store.initialize();
    return { store, close: () => client.close() };
  } catch (error) {
    await client.close();
    throw error;
  }
}
