# ParkEase — Smart Parking Management System
*Smart Parking. Seamless Experience.*

## 1. Overview
Full-stack MERN application (React + Vite + Tailwind client, Express + Mongoose API, MongoDB) for finding, reserving and managing parking spaces, with an admin console, audit log, analytics and database reliability tooling. Built as a college final project covering MongoDB CRUD, indexing, replication, backup and deployment.

## 2. Problem statement
Drivers waste time searching for parking and operators struggle with double bookings and visibility. ParkEase gives drivers real-time availability and conflict-free reservations, and operators a single place to manage spaces, bookings and users.

## 3. Objectives
CRUD with MongoDB · efficient indexed queries · replication and backup strategy · authentication/authorization · atomic overlap-free booking · tested, deployable app.

## 4. Key features
Registration/login (JWT) · live availability map with colour-coded slots · filters (location, floor, vehicle type, time window) · booking with server-side re-check · booking lifecycle (confirm → check in → check out / cancel) · profile · admin: slots CRUD, bookings search, users & roles, analytics charts, audit log, live database/replication/index view.

## 5. Technology stack
Client: React 18, Vite 5, Tailwind 3, React Router 6, Axios, Lucide, Framer Motion, Recharts. Server: Node 20+/22, Express, Mongoose, JWT, bcryptjs, express-validator, Helmet, express-rate-limit. Tests: Vitest, Supertest, React Testing Library. DB: MongoDB (Atlas). Deploy: Vercel + Render + Atlas.

## 6. Architecture
`Browser (React SPA on Vercel) → HTTPS/JSON → Express API (Render) → MongoDB Atlas replica set`. Layers: routes → validation → controllers → services (booking transaction) → Mongoose models.

## 7. Folder structure
```
client/            React app (src/pages, components, layouts, services, context, hooks, utils)
server/            API (src/{config,models,controllers,routes,middleware,services,utils}, scripts/, tests/)
database/          indexes/, backup/ (scripts), replication/ (docs + local set script)
docs/              API.md, DEPLOYMENT.md, VIVA.md, Postman collection, screenshots/
render.yaml        Render blueprint
```

## 8. Prerequisites
Node.js 20+ (built with 22), npm, a MongoDB **replica set** (Atlas free tier is fine). For backups: MongoDB Database Tools + mongosh.

## 9–11. Install & setup
```bash
# Backend
cd server && npm install && cp .env.example .env     # edit .env
# Frontend
cd ../client && npm install && cp .env.example .env  # leave VITE_API_BASE_URL empty in dev (proxy to :5000)
```

## 12. MongoDB Atlas
See `docs/DEPLOYMENT.md` §1 (cluster, DB user with readWrite on `parkease`, network access, URI with DB name).

## 13. Environment variables
Server `.env`: `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET` (≥16 chars), `CLIENT_ORIGIN`; optional `JWT_EXPIRES_IN`, `SEED_ADMIN_PASSWORD`, `SEED_USER_PASSWORD`. Client `.env`: `VITE_API_BASE_URL`, `VITE_CONTACT_EMAIL` (optional). `.env` files are git-ignored.

## 14. Seeding (development only)
`cd server && npm run seed` — idempotent; creates demo users and 40 slots. Refuses to run when `NODE_ENV=production`.

## 15. Run locally
```bash
cd server && npm run dev        # http://localhost:5000
cd client && npm run dev        # http://localhost:5173
```

## 16. Demo users (after seeding, dev only)
`admin@parkease.local` / `Admin@12345` · `user@parkease.local` / `User@12345` (override via `SEED_*_PASSWORD`). Never use these in production — use `npm run create-admin` (see deployment guide).

## 17. API
See `docs/API.md` and `docs/ParkEase.postman_collection.json` (import into Postman; set `slotId`/`bookingId` variables).

## 18. CRUD demonstration
Admin → Parking slots: create, edit, delete (with safe-deletion policy). Bookings: create/read/cancel/check-in/check-out via the UI or Postman.

## 19–20. Indexes & performance comparison
`database/indexes/README.md`; run `cd server && PERF_DOCS=100000 npm run perf` for measured before/after `explain` results (saved to `docs/performance-results.json`). Admin → Database shows live plans.

## 21. Replication
`database/replication/README.md`, `npm run replica-status`, Admin → Database.

## 22. Backup & restore
`database/backup/README.md` (`backup.sh`, `restore-test.sh`).

## 23. Testing
```bash
cd server && npm test                                   # 12 smoke tests (no DB needed); the 18 integration tests are skipped without MONGODB_URI_TEST
MONGODB_URI_TEST='<replica-set URI to a DB whose name contains "test">' npm test   # full suite (drops that DB!)
cd client && npm test                                   # 6 unit/component tests
cd client && npm run build                              # production build
```

## 24. Deployment
`docs/DEPLOYMENT.md` (Atlas → Render → Vercel, first-admin creation, verification checklist).

## 25. Troubleshooting
Table at the end of `docs/DEPLOYMENT.md`.

## 26. Security notes
bcrypt hashes; JWT; server-side RBAC; owner-or-admin booking access (404 otherwise); validation on all inputs; Helmet; CORS allow-list; rate limits (stricter on auth); duplicate-key and cast errors mapped to 4xx; no stack traces in production; audit log of admin/booking actions; secrets only via env. Tokens are kept in `localStorage` (simple, but exposed to XSS — httpOnly cookies are a future hardening step).

## 27. Verification status & known limitations (honest)
**Executed during the build** (Linux sandbox, MongoDB 8.3.7 as a replica set, Node 22):
- Server: 30/30 tests pass (12 smoke + 18 integration incl. concurrent booking); client: 6/6 tests pass; client production build succeeds.
- Real HTTP run: seed (run twice, idempotent), register/login, booking, overlap rejection (409), live map availability, check-in → check-out lifecycle, audit log, admin stats, `/api/admin/db-info`, role enforcement (403).
- Concurrency over HTTP: 25 simultaneous overlapping booking requests × 3 rounds → exactly one 201 and 24 × 409 each round.
- `npm run perf` (100,000 synthetic bookings): COLLSCAN examining 100,000 docs became IXSCAN examining 1–104 docs on all four queries (saved in `docs/performance-results.json`; **your numbers will differ**).
- Backup + restore: `backup.sh` produced an archive; `mongorestore` into a scratch database gave matching document counts in all four collections.
- Replication: 3-member local set; primary killed with `kill -9` while the API was running; a new primary was elected and the API served bookings again without restart ~10 s later (one request timed out meanwhile).

**Not verified — you must do these:**
- A browser walkthrough of the React UI against a live API (the client builds and its unit tests pass, but no browser was available to click through pages).
- Deployment to Atlas/Render/Vercel and the post-deploy checklist in `docs/DEPLOYMENT.md`.
- `restore-test.sh` as a whole (it needs `mongosh`, which was not available; its `mongorestore` step and the count comparison were done by other means).
- Atlas-specific behaviour (network access, free-tier limits).

**Limitations**
- No hero video is bundled (licence can't be verified): put a clip you may use at `client/public/hero.mp4`; a gradient fallback shows otherwise.
- Slot `status` on the record is administrative; live availability on the map is computed from bookings for the chosen window.
- No payments or email notifications; `no_show` is reserved for a future scheduled job. No ESLint setup. "Watch Demo" scrolls to How it works.
- The overlap-check query examined up to 104 index entries to return 0 rows in the perf demo; fine at this scale, and a compound index including `endTime` is a possible refinement for very busy slots.
- Tokens are stored in `localStorage` (XSS exposure); httpOnly cookies are a future hardening step.

## 28. Future enhancements
Payments, notifications, QR check-in, scheduled no-show job, httpOnly-cookie auth, maps of real locations, dynamic pricing, CI pipeline.

## 29. Requirement mapping
See the table in `docs/VIVA.md`.

### Screenshots (add yours)
Run the app, then capture: landing, login, discovery map, booking form, confirmation, my bookings, admin overview, slots, reports, database page. Save PNGs in `docs/screenshots/` and link them here (e.g. `![Landing](docs/screenshots/landing.png)`).
