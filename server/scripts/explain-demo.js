// Reproducible index demonstration. Uses its OWN scratch collection (parkease_perf_demo); never touches real data.
// Usage: PERF_DOCS=100000 npm run perf      -> prints measured results and writes docs/performance-results.json
import fs from 'node:fs';
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';

const N = Number(process.env.PERF_DOCS) || 100000;
const STATUSES = ['confirmed', 'checked_in', 'completed', 'cancelled', 'no_show'];
let seed = 42; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296; // deterministic data

await mongoose.connect(config.mongoUri);
const col = mongoose.connection.db.collection('parkease_perf_demo');
await col.drop().catch(() => {});
const users = Array.from({ length: 500 }, () => new mongoose.Types.ObjectId());
const slots = Array.from({ length: 300 }, () => new mongoose.Types.ObjectId());
const base = Date.now() - 180 * 86400000;
const docs = Array.from({ length: N }, (_, i) => {
  const start = new Date(base + Math.floor(rnd() * 360 * 86400000));
  return { bookingReference: `D-${i}`, userId: users[Math.floor(rnd() * users.length)], slotId: slots[Math.floor(rnd() * slots.length)],
    vehicleNumber: `RJ${String(Math.floor(rnd() * 99)).padStart(2, '0')}AB${String(Math.floor(rnd() * 9999)).padStart(4, '0')}`,
    startTime: start, endTime: new Date(start.getTime() + (1 + Math.floor(rnd() * 8)) * 3600000), status: STATUSES[Math.floor(rnd() * STATUSES.length)], createdAt: start };
});
for (let i = 0; i < docs.length; i += 10000) await col.insertMany(docs.slice(i, i + 10000));
console.log(`Inserted ${N} synthetic bookings into parkease_perf_demo\n`);

const probe = { user: users[7], slot: slots[11], vehicle: docs[123].vehicleNumber, from: new Date(base + 100 * 86400000), to: new Date(base + 100.5 * 86400000) };
const queries = [
  { name: 'User bookings, newest first', run: () => col.find({ userId: probe.user }).sort({ startTime: -1 }).limit(20), index: { userId: 1, startTime: -1 } },
  { name: 'Slot overlap check', run: () => col.find({ slotId: probe.slot, status: { $in: ['confirmed', 'checked_in'] }, startTime: { $lt: probe.to }, endTime: { $gt: probe.from } }), index: { slotId: 1, startTime: 1 } },
  { name: 'Vehicle number lookup', run: () => col.find({ vehicleNumber: probe.vehicle }), index: { vehicleNumber: 1 } },
  { name: 'Recent bookings by status', run: () => col.find({ status: 'confirmed' }).sort({ createdAt: -1 }).limit(20), index: { status: 1, createdAt: -1 } },
];
const stage = (e) => { const j = JSON.stringify(e.queryPlanner.winningPlan); return j.includes('IXSCAN') ? 'IXSCAN' : j.includes('COLLSCAN') ? 'COLLSCAN' : 'OTHER'; };
const measure = async (q) => { const e = await q.run().explain('executionStats'); const x = e.executionStats; return { stage: stage(e), docsExamined: x.totalDocsExamined, keysExamined: x.totalKeysExamined, returned: x.nReturned, millis: x.executionTimeMillis }; };

const results = [];
for (const q of queries) results.push({ query: q.name, index: JSON.stringify(q.index), before: await measure(q) });
for (const q of queries) await col.createIndex(q.index);
for (const [i, q] of queries.entries()) results[i].after = await measure(q);
console.table(results.map((r) => ({ query: r.query, 'stage before': r.before.stage, 'docs examined before': r.before.docsExamined, 'ms before': r.before.millis, 'stage after': r.after.stage, 'docs examined after': r.after.docsExamined, 'keys examined after': r.after.keysExamined, returned: r.after.returned, 'ms after': r.after.millis })));
const report = { generatedAt: new Date().toISOString(), documents: N, note: 'Measured on this deployment; results depend on hardware, cache state, dataset size and query shape.', results };
fs.mkdirSync(new URL('../../docs/', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('../../docs/performance-results.json', import.meta.url), JSON.stringify(report, null, 2));
await col.drop();
console.log('\nSaved docs/performance-results.json. Scratch collection dropped.');
await mongoose.disconnect();
