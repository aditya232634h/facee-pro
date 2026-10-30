# ParkEase API (Phases 1–4)

Base URL: `http://localhost:5000/api`. Auth: `Authorization: Bearer <jwt>`.
Success: `{ "success": true, "data": ..., "meta": { page, limit, total, totalPages } }`
Error: `{ "success": false, "error": { "code", "message", "details?" } }`

| Method | Path | Access | Notes |
|---|---|---|---|
| GET | /health | public | 200 when DB connected, else 503 |
| POST | /auth/register | public | body: name, email, password (8–72). Role is always `user` |
| POST | /auth/login | public | returns user + token |
| GET | /auth/me | user | |
| PATCH | /auth/me | user | name and/or password change (currentPassword + newPassword) |
| GET | /public/stats | public | real live counts for the landing page |
| GET | /slots/meta | user | facilities, floors, zones, vehicle types for filters |
| GET | /slots | user | filters: facility, floor, zone, vehicleType, status, startTime+endTime (free in window); page, limit, sort |
| GET | /slots/:id | user | |
| POST | /slots | admin | slotNumber, facility, floor, zone, hourlyRate, vehicleType?, status? |
| PUT | /slots/:id | admin | partial update |
| DELETE | /slots/:id | admin | 409 if active/upcoming bookings; deactivates (maintenance) if history exists; deletes if unused |
| POST | /bookings | user | slotId, vehicleNumber, startTime, endTime (ISO). 409 on overlap |
| GET | /bookings | user/admin | users see only their own; admin may filter userId, status, vehicleNumber (prefix), from, to |
| GET | /bookings/:id | owner/admin | non-owner gets 404 |
| PATCH | /bookings/:id/cancel | owner/admin | confirmed -> cancelled |
| PATCH | /bookings/:id/check-in | owner/admin | confirmed -> checked_in (opens 15 min before start) |
| PATCH | /bookings/:id/check-out | owner/admin | checked_in -> completed |
| GET | /admin/stats | admin | slot/booking counts, occupancy, bookings per day |
| GET | /admin/users | admin | q, role, page, limit |
| PATCH | /admin/users/:id/role | admin | cannot change own role |
| GET | /admin/audit-logs | admin | action, entityType filters |
| GET | /admin/db-info | admin | live replica-set status, collection/index lists, explain() of sample queries |

Added beyond the brief's list: `/health`, `/public/stats`, `/slots/meta`, `PATCH /auth/me`, `PATCH /admin/users/:id/role`, `/admin/db-info`.

## Booking concurrency
A unique index cannot express time-range overlap. `services/bookingService.js` runs each booking in a
transaction that first `$inc`s `bookingSeq` on the slot document. Concurrent bookings for the same slot
therefore write-conflict; MongoDB aborts one, `withTransaction` retries it, and the retry's overlap check
(`newStart < existingEnd AND newEnd > existingStart`, blocking statuses `confirmed`, `checked_in`) finds the winner and returns 409.
Back-to-back bookings (end == next start) are allowed. **Requires a replica set** (Atlas, or a local single-node replica set).

## Booking lifecycle
`confirmed -> checked_in -> completed`; `confirmed -> cancelled`; `no_show` is reserved for a later job.
