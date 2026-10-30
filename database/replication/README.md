# Replication

A replica set keeps copies of the data on several members: one **primary** takes writes, **secondaries** replicate them, and if the primary fails an election promotes a secondary. ParkEase *requires* a replica set because booking uses multi-document transactions.

## Option A — MongoDB Atlas (recommended)
Every Atlas cluster, including the free tier, is a 3-member replica set. Use the `mongodb+srv://` URI (it carries the replica-set topology and `retryWrites=true&w=majority`).

## Option B — local 3-node set
```bash
./database/replication/start-local-replset.sh
export MONGODB_URI='mongodb://127.0.0.1:27017,127.0.0.1:27018,127.0.0.1:27019/parkease?replicaSet=rs0'
```

## Verify (real output from your deployment)
```bash
cd server && npm run replica-status        # set name, primary, members and states
```
or sign in as admin → **Admin → Database** page (reads `hello` live).

## Failover demonstration (local set)
1. `cd server && npm run dev` and keep it running; run `npm run replica-status` and note the primary (say `:27017`).
2. Stop that member: `kill $(cat ~/parkease-rs/27017/mongod.pid)`.
3. Within ~10–15 s another member becomes primary (`mongosh --port 27018 --eval 'rs.status().members.map(m=>[m.name,m.stateStr])'`).
4. Requests made during the election may fail once; the driver re-discovers the new primary and the API recovers without a restart (booking transactions are retried by `withTransaction`, and `retryWrites=true` retries single writes). Verify with `GET /api/health` and a new booking.
5. Restart the stopped member; it rejoins as a secondary.

On Atlas dedicated tiers, a primary failover can be triggered from the cluster's "Test Resiliency" option (not available on the free tier; check current Atlas docs).

## Limitations
- Status: the failover sequence above was run once in the build sandbox on a 3-member local set (primary killed with `kill -9`; new primary elected; API recovered without restart in about 10 s with one timed-out request). Re-run it yourself before presenting results.
- A local set on one machine shows the mechanics but not real fault tolerance. Replication improves availability; it is not a backup (see `../backup`).
