// Creates (or promotes) the first admin. Safe for production: credentials come from env vars, never hard-coded.
// Usage: ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long-strong-password' ADMIN_NAME='Your Name' npm run create-admin
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { config } from '../src/config/env.js';
import User from '../src/models/User.js';

const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Administrator' } = process.env;
if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD (min 12 chars).'); process.exit(1);
}
await mongoose.connect(config.mongoUri);
const email = ADMIN_EMAIL.toLowerCase().trim();
const existing = await User.findOne({ email });
if (existing) { existing.role = 'admin'; await existing.save(); console.log(`Existing user ${email} promoted to admin (password unchanged).`); }
else { await User.create({ name: ADMIN_NAME, email, passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 12), role: 'admin' }); console.log(`Admin ${email} created.`); }
await mongoose.disconnect();
