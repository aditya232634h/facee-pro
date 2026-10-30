// Prints real replica-set facts from the connected deployment. Run: npm run replica-status
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
await mongoose.connect(config.mongoUri);
const admin = mongoose.connection.db.admin();
const h = await admin.command({ hello: 1 });
console.log('Replica set name :', h.setName || '(none: standalone server)');
console.log('Connected to     :', h.me);
console.log('Primary          :', h.primary || '(unknown)');
console.log('All members      :', (h.hosts || []).join(', ') || '-');
try {
  const st = await admin.command({ replSetGetStatus: 1 });
  for (const m of st.members) console.log(`  ${m.name.padEnd(40)} ${m.stateStr.padEnd(10)} health=${m.health}`);
} catch (e) { console.log('replSetGetStatus not permitted/available here:', e.codeName || e.message, '(normal on some Atlas roles/tiers)'); }
await mongoose.disconnect();
