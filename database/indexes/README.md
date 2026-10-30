# Indexes

Defined in the Mongoose models (created automatically at startup via `autoIndex`; in large production DBs prefer creating them during deploy windows).

| Collection | Index | Serves |
|---|---|---|
| users | `{email:1}` unique | login, duplicate-email protection |
| parkingslots | `{facility:1, slotNumber:1}` unique | slot identity per facility; facility-filtered listings (prefix) |
| bookings | `{bookingReference:1}` unique | reference lookup, duplicate protection |
| bookings | `{userId:1, startTime:-1}` | "My bookings", newest first |
| bookings | `{slotId:1, startTime:1}` | overlap check for one slot, slot history |
| bookings | `{status:1, createdAt:-1}` | admin status filters, recent bookings, stats |
| bookings | `{vehicleNumber:1}` | vehicle search (anchored prefix regex) |
| auditlogs | `{timestamp:-1}`, `{actorId:1, timestamp:-1}` | audit log pages |

## Reproducible before/after demo
```bash
cd server
PERF_DOCS=100000 npm run perf
```
Inserts deterministic synthetic bookings into a scratch collection (`parkease_perf_demo`, dropped afterwards — real data untouched), runs four representative queries with `explain("executionStats")` **without** indexes, creates the matching index for each, re-runs them, prints a table, and saves `docs/performance-results.json`. Report only numbers from your own run; results vary with hardware, cache state, data size and query shape.
