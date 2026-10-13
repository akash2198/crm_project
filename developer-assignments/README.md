# Developer assignments

Two independent projects built for the supplied assignment brief.

- **fastor-react/**: React/Vite food-ordering interface based on the linked Figma. Run `npm ci` then `npm run dev` in that directory. Demo OTP: **123456**.
- **crm-api/**: Express/PostgreSQL CRM REST API with employee registration/login, JWT authentication, public enquiry capture, atomic claiming, unclaimed lists and private lead lists. Follow its README for database setup.

Each project includes a lockfile, source, tests and setup documentation. The backend also includes Docker Compose for PostgreSQL and an importable Postman collection. These are separate assignments, not a connected full-stack application.

Submission deadline supplied in the brief: **14 October 2026, 5:00 PM IST**. The submission form has not been filled or submitted.

## Verification

- React production build: passed.
- Cart calculation test: passed (1 test).
- CRM integration suite: passed (5 tests), running the actual SQL on embedded PostgreSQL via PGlite.
- Browser: invalid phone and OTP errors, valid OTP navigation, portion/quantity price updates, cart totals, and demo checkout checked. Mobile and desktop layouts inspected; screenshots included.
- A full PostgreSQL server was not running on this machine (Docker daemon stopped). Full-server connection concurrency remains unverified; instructions and the same integration suite support testing it via `TEST_DATABASE_URL`.
- SMS, payment, restaurant order processing and live location are outside the React assignment's demo scope and are not connected.

See each project's README for implementation decisions and limitations.
