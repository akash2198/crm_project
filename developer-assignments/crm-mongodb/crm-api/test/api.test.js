import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { MongoClient } from "mongodb";
import { createStore } from "../src/db.js";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createApp } from "../src/app.js";

// Every run creates and removes its own isolated database on the supplied server.
const client = new MongoClient(
  process.env.MONGODB_URI ||
    "mongodb://crm:crm_local_password@127.0.0.1:27017/crm?authSource=admin",
  { serverSelectionTimeoutMS: 5000 },
);
const database = client.db(`crm_test_${randomUUID().replaceAll("-", "")}`);
const db = createStore(database);
const secret = "test-only-secret-with-at-least-32-characters";
const api = request(createApp({ db, jwtSecret: secret, rateLimits: false }));
let alice, bob, lead;
before(async () => {
  await client.connect();
  await db.initialize();
});
after(async () => {
  try {
    await database.dropDatabase();
  } finally {
    await client.close();
  }
});
test("registration normalizes email, hashes password and rejects duplicates", async () => {
  const a = await api
    .post("/api/auth/register")
    .send({
      name: "Alice",
      email: " ALICE@example.com ",
      password: "StrongPassword12!",
    })
    .expect(201);
  alice = a.body;
  assert.equal(alice.employee.email, "alice@example.com");
  assert.equal(alice.employee.password_hash, undefined);
  assert.ok(alice.token);
  const stored = await db.findEmployeeById(alice.employee.id);
  assert.match(stored.passwordHash, /^\$2[aby]\$/);
  assert.notEqual(stored.passwordHash, "StrongPassword12!");
  assert.equal(alice.employee.passwordHash, undefined);
  await api
    .post("/api/auth/register")
    .send({
      name: "Again",
      email: "alice@example.com",
      password: "StrongPassword12!",
    })
    .expect(409);
  bob = (
    await api
      .post("/api/auth/register")
      .send({
        name: "Bob",
        email: "bob@example.com",
        password: "StrongPassword12!",
      })
      .expect(201)
  ).body;
});
test("login and JWT authentication reject invalid, tampered and expired credentials", async () => {
  await api
    .post("/api/auth/login")
    .send({ email: "alice@example.com", password: "wrong-password" })
    .expect(401);
  await api
    .post("/api/auth/login")
    .send({ email: "nobody@example.com", password: "wrong-password" })
    .expect(401);
  await api
    .post("/api/auth/login")
    .send({ email: "alice@example.com", password: "StrongPassword12!" })
    .expect(200);
  await api.get("/api/enquiries/unclaimed").expect(401);
  await api
    .get("/api/enquiries/mine")
    .set("Authorization", "Bearer invalid")
    .expect(401);
  const expired = jwt.sign({}, secret, {
    subject: alice.employee.id,
    issuer: "counselor-crm",
    audience: "crm-api",
    expiresIn: -1,
  });
  await api
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${expired}`)
    .expect(401);
  await api
    .get("/api/auth/me")
    .set("Authorization", `Bearer ${alice.token}`)
    .expect(200);
});
test("public submission works without authentication; rejects ownership injection", async () => {
  const body = {
    name: "Student",
    email: "student@example.com",
    courseInterest: "React",
  };
  lead = (await api.post("/api/enquiries").send(body).expect(201)).body.enquiry;
  await api
    .post("/api/enquiries")
    .send({ ...body, claimedBy: bob.employee.id })
    .expect(400);
  await api
    .post("/api/enquiries")
    .send({ ...body, email: "invalid" })
    .expect(400);
  for (const employee of [alice, bob]) {
    const result = await api
      .get("/api/enquiries/unclaimed")
      .set("Authorization", `Bearer ${employee.token}`)
      .expect(200);
    assert.ok(result.body.enquiries.some((item) => item.id === lead.id));
  }
});
test("concurrent claim has one winner; lead disappears publicly and is private to winner", async () => {
  const results = await Promise.all(
    [alice, bob].map((employee) =>
      api
        .post(`/api/enquiries/${lead.id}/claim`)
        .set("Authorization", `Bearer ${employee.token}`),
    ),
  );
  assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
  const winner = results[0].status === 200 ? alice : bob;
  for (const employee of [alice, bob]) {
    const headers = { Authorization: `Bearer ${employee.token}` };
    const publicResult = await api
      .get("/api/enquiries/unclaimed")
      .set(headers)
      .expect(200);
    assert.equal(
      publicResult.body.enquiries.some((item) => item.id === lead.id),
      false,
    );
    const ownResult = await api
      .get("/api/enquiries/mine")
      .set(headers)
      .expect(200);
    assert.equal(
      ownResult.body.enquiries.some((item) => item.id === lead.id),
      employee === winner,
    );
    await api.post(`/api/enquiries/${lead.id}/claim`).set(headers).expect(409);
  }
});
test("invalid IDs, pagination, malformed JSON and unknown routes produce safe errors", async () => {
  const headers = { Authorization: `Bearer ${alice.token}` };
  await api.post("/api/enquiries/not-a-uuid/claim").set(headers).expect(400);
  await api.get("/api/enquiries/unclaimed?limit=101").set(headers).expect(400);
  await api.get("/api/enquiries/mine?page=0").set(headers).expect(400);
  await api
    .post("/api/enquiries")
    .set("Content-Type", "application/json")
    .send("{oops")
    .expect(400);
  await api.get("/unknown").expect(404);
  await api.get("/health").expect(200);
});

test("MongoDB persists documents across connections, enforces unique email and rejects operator injection", async () => {
  const secondClient = new MongoClient(
    process.env.MONGODB_URI ||
      "mongodb://crm:crm_local_password@127.0.0.1:27017/crm?authSource=admin",
  );
  try {
    await secondClient.connect();
    const secondDatabase = secondClient.db(database.databaseName);
    const reconnected = createStore(secondDatabase);
    assert.equal(
      (await reconnected.findEmployeeById(alice.employee.id)).email,
      "alice@example.com",
    );
    const storedLead = await secondDatabase
      .collection("enquiries")
      .findOne({ _id: lead.id });
    assert.ok(
      [alice.employee.id, bob.employee.id].includes(storedLead.claimedBy),
    );
    assert.ok(storedLead.claimedAt instanceof Date);
    const indexes = await secondDatabase.collection("employees").indexes();
    assert.ok(indexes.some((index) => index.key.email === 1 && index.unique));
  } finally {
    await secondClient.close();
  }
  await api
    .post("/api/auth/login")
    .send({ email: { $ne: null }, password: "StrongPassword12!" })
    .expect(400);
  await api.post(`/api/enquiries/${lead.id}/claim`).expect(401);
});
