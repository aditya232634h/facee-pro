// Development-only, idempotent seed. Refuses to run in production.
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import User from '../src/models/User.js';
import ParkingSlot from '../src/models/ParkingSlot.js';

if (config.env === 'production') { console.error('Refusing to seed in production.'); process.exit(1); }

const demoUsers = [
  { name: 'Demo Admin', email: 'admin@parkease.local', password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345', role: 'admin' },
  { name: 'Demo User', email: 'user@parkease.local', password: process.env.SEED_USER_PASSWORD || 'User@12345', role: 'user' },
];
const facilities = [{ name: 'Central Plaza Garage', floors: [1, 2], rate: 40 }, { name: 'Airport Lot B', floors: [1], rate: 60 }];
const zones = ['A', 'B'];

await mongoose.connect(config.mongoUri);
for (const u of demoUsers) {
  await User.updateOne({ email: u.email }, { $setOnInsert: { name: u.name, email: u.email, role: u.role, passwordHash: await bcrypt.hash(u.password, 12) } }, { upsert: true });
}
let slots = 0;
for (const f of facilities) for (const floor of f.floors) for (const zone of zones) for (let n = 1; n <= 10; n++) {
  const types = ['car', 'car', 'car', 'ev', 'bike', 'accessible'];
  await ParkingSlot.updateOne({ facility: f.name, slotNumber: `${zone}${floor}-${String(n).padStart(2, '0')}` },
    { $setOnInsert: { floor, zone, vehicleType: types[n % types.length], status: 'available', hourlyRate: f.rate } }, { upsert: true });
  slots++;
}
console.log(`Seed complete (rerunnable): ${demoUsers.length} users, ${slots} slots ensured.`);
await mongoose.disconnect();
