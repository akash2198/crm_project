# Counselor CRM REST API · MongoDB edition

Node.js 22+, Express 5, MongoDB 8 in Docker, JWT and bcrypt. All API endpoints and JSON response shapes remain the same as the PostgreSQL edition. This backend is separate from the Fastor React food app.

## Start locally

Start Docker Desktop. Extract this edition into a **new folder** so you do not reuse old root-owned node_modules. Stop the previous API with Ctrl+C to free port 3000. In this edition's `crm-api` folder, run:

```sh
npm ci
node scripts/setup.js
docker compose up -d --wait
npm run migrate
npm start
```

Use npm without sudo. The API starts at `http://localhost:3000`. `GET /health` pings MongoDB. `npm run migrate` now creates MongoDB collections/indexes, not SQL tables; it is idempotent and startup also ensures indexes exist.

The setup script creates `.env` with a random JWT secret. If an old `.env` exists, it adds MONGODB_URI while preserving the JWT secret and other settings. Old DATABASE_URL values are ignored. The MongoDB edition uses a separate Compose project and named volume: it does not delete or modify the PostgreSQL database. **Existing PostgreSQL employees and enquiries are not copied. Register fresh employees and submit new enquiries, or arrange a separate data migration.**

## View your database

Local development connection for MongoDB Compass or mongosh:

```text
mongodb://crm:crm_local_password@127.0.0.1:27017/crm?authSource=admin
```

- Server: `127.0.0.1:27017`
- Database: `crm`
- Collections: `employees`, `enquiries`
- Username: `crm`; password: `crm_local_password`; authentication database: `admin`
- Docker container: `counselor-crm-mongodb-mongo-1`
- Persistent volume: `counselor-crm-mongodb_mongo_data`

For a terminal shell, run from this project's directory:

```sh
docker compose exec mongo mongosh 'mongodb://crm:crm_local_password@127.0.0.1:27017/crm?authSource=admin'
```

Then inspect records:

```js
show collections
db.employees.find({}, { passwordHash: 0 })
db.enquiries.find()
db.enquiries.find({ claimedBy: null })
db.enquiries.find({ claimedBy: "EMPLOYEE_UUID" })
exit
```

MongoDB stores UUID strings in `_id`; API responses expose these as `id` for compatibility. `claimedBy` references the employee UUID. Direct database access can see all documents; counselor privacy is enforced by the API. Passwords are hashes, not plaintext. The default account is a local-development database admin; use a dedicated least-privilege application account and deployment secrets for production.

Stopping: `docker compose stop`. Restarting: `docker compose up -d --wait`. Records persist in the named volume across container restarts. Do not delete the volume if you want to keep the records.

## API

All request/response bodies use JSON. Protected endpoints require `Authorization: Bearer <token>`. Tokens expire after one hour; log in again to obtain another.

- `POST /api/auth/register` — public. Body: `{ "name": "Alice", "email": "alice@example.com", "password": "StrongPassword12!" }`. Returns `201` with `employee`, `token`, `expiresIn`.
- `POST /api/auth/login` — public. Body: `{ "email": "alice@example.com", "password": "StrongPassword12!" }`. Returns `200` with the same response shape.
- `GET /api/auth/me` — protected. Returns the authenticated employee.
- `POST /api/enquiries` — public; no JWT required. Body: `{ "name": "Student", "email": "student@example.com", "courseInterest": "React", "phone": "9876543210", "message": "Please send course details" }`. Phone/message are optional. Returns `201` with enquiry ID and creation timestamp.
- `GET /api/enquiries/unclaimed?page=1&limit=20` — protected. Lists only public, unclaimed enquiries.
- `GET /api/enquiries/mine?page=1&limit=20` — protected. Lists only enquiries owned by the authenticated employee.
- `POST /api/enquiries/:id/claim` — protected. Empty body. Atomically assigns an unclaimed enquiry to the authenticated employee. Returns `200` with the enquiry, or `409` if unavailable/already claimed.

Lists return `{ "enquiries": [], "page": 1, "limit": 20 }`; maximum page size is 100. Errors return `{ "error": { "message": "..." } }`, with field issues for validation errors. Status codes: `400` validation/malformed JSON, `401` authentication, `404` unknown route, `409` duplicate account/unavailable claim, `413` oversized JSON, `429` rate limit, `500` unexpected failure.

Import `crm.postman_collection.json` in Postman. Register/login automatically saves the collection token, and public enquiry submission saves the enquiry ID. Run the requests in their listed order.

## Claim correctness and validation

`findOneAndUpdate({ _id: id, claimedBy: null }, { $set: { claimedBy: employeeId, claimedAt: new Date() } })` checks availability and assigns the lead in one atomic single-document operation. A competing claim no longer matches the filter, so only one request succeeds. No replica set or transaction is needed for this operation. Missing/already-owned IDs return the same 409 response without exposing another counselor's data.

A unique MongoDB index enforces normalized employee email uniqueness, including simultaneous registrations. Zod validates input, rejects unknown fields and rejects objects where strings are expected, preventing MongoDB operator injection through these endpoints. Application validation is at the API boundary; database admin tools can bypass it. MongoDB has no SQL foreign-key constraints; the API verifies the employee exists and derives ownership solely from JWT authentication. There is no employee deletion endpoint.

JWT verification restricts algorithm, issuer, audience and expiry; passwords use bcrypt cost 12. Rate limits are per-process/in-memory (30 auth requests, 200 enquiry requests per IP per 15 minutes). Use a shared limiter store and configure trusted proxies explicitly if deploying multiple instances. Public employee registration follows the assignment; real employee onboarding may require invitations or verified email. Password recovery, refresh tokens and email delivery are outside this brief.

## Tests

Start the Docker database, then run:

```sh
npm test
```

The suite uses a real MongoDB server, creates a uniquely named `crm_test_*` database and removes that database afterward. It never drops the application `crm` database. The supplied development account has permission to create/drop these test databases. To use another disposable MongoDB server, set MONGODB_URI. Do not use production database credentials for tests.

Tests cover registration, hashing, duplicate email, login/JWT validation, unauthenticated enquiry creation, injection rejection, public visibility, simultaneous claims, private lists, invalid requests, indexes and persisted records. The Postman collection remains compatible.

## Structure

- `src/app.js`: Express routes, authentication, request validation and safe errors.
- `src/db.js`: MongoDB connection, indexes and data operations.
- `src/server.js`: startup and graceful shutdown.
- `src/migrate.js`: idempotent collection/index initialization.
- `scripts/setup.js`: environment setup and safe upgrade from the PostgreSQL edition.
- `test/api.test.js`: acceptance tests against MongoDB.

References: [MongoDB compound operations](https://www.mongodb.com/docs/drivers/node/current/crud/compound-operations/) and [single-document atomicity](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/).
