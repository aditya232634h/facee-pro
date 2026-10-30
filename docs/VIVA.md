# Demonstration & viva guide

## Mapping: mandatory requirements → evidence
| Requirement | Where | How to demonstrate |
|---|---|---|
| 1. Backend with MongoDB | `server/src/models/*`, `config/db.js` | 4 collections: `users`, `parkingslots`, `bookings`, `auditlogs` (Mongoose refs: booking→user, booking→slot, audit→user) |
| 2. Full CRUD | `controllers/slots.js`, `bookings.js`; Admin → Parking slots | Create/edit/delete a slot in the UI; Postman collection `docs/ParkEase.postman_collection.json` |
| 3. Efficient queries & indexes | `database/indexes/README.md`, `scripts/explain-demo.js`, Admin → Database | `npm run perf` (COLLSCAN → IXSCAN, docs examined drops); Database page shows live `explain` |
| 4. Replication & backup | `database/replication/`, `database/backup/`, `npm run replica-status` | Show replica set status; kill primary and show re-election (local set); run backup then restore-test and compare counts |
| 5. Deployment & testing | `render.yaml`, `client/vercel.json`, `docs/DEPLOYMENT.md`, `server/tests`, `client/src/**/*.test.jsx` | Live URLs + `/api/health`; `npm test` in both folders |

Run each demo yourself and report only what you observe. `docs/performance-results.json` holds one real run from the build sandbox (100,000 docs) for reference; your hardware will give different timings.

## Likely questions
1. **Why MongoDB for this?** Flexible documents, strong indexing, transactions on replica sets, easy Atlas hosting. Bookings reference users/slots by `ObjectId`.
2. **How do you prevent double booking?** Overlap rule `newStart < existingEnd AND newEnd > existingStart` over blocking statuses, checked inside a transaction that first `$inc`s a counter on the slot document. Concurrent bookings of the same slot write-conflict; one is retried and then sees the other's booking → 409. A unique index alone can't express range overlap.
3. **Why does it need a replica set?** Multi-document transactions require one.
4. **Which indexes and why?** See `database/indexes/README.md`; each matches a real filter/sort (e.g. `{userId, startTime:-1}` for My bookings).
5. **What does `explain` show?** `COLLSCAN` examines every document; `IXSCAN` examines only matching keys. Compare `totalDocsExamined` vs `nReturned`.
6. **Replication vs backup?** Replication = availability (failover). Backup = recovery from deletion/corruption. Both needed.
7. **How is auth done?** bcrypt (cost 12) password hashes, JWT bearer tokens, role loaded fresh from DB per request, `authorize('admin')` middleware on admin routes (server-side, not only hidden in UI).
8. **Can a user read another's booking?** No: lookup is owner-or-admin, otherwise 404.
9. **What if a slot with bookings is deleted?** Active/upcoming bookings → 409; only history → deactivated (maintenance); none → deleted.
10. **How do you handle duplicate emails?** Unique index + duplicate-key mapped to HTTP 409.
11. **Security hardening?** Helmet, restricted CORS, rate limits, validation (express-validator), body size limit, no stack traces in production, secrets only in env vars.
12. **How do you restore a backup?** `mongorestore --gzip --archive=<file> --drop`; first test with `restore-test.sh` into a scratch database and compare counts.
