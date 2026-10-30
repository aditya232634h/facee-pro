// Integration tests: need a SEPARATE test database on a replica set (booking uses transactions).
// Run: MONGODB_URI_TEST="mongodb+srv://.../parkease_test?..." npm test
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import app from '../src/app.js';
import User from '../src/models/User.js';
import ParkingSlot from '../src/models/ParkingSlot.js';
import Booking from '../src/models/Booking.js';

const uri = process.env.MONGODB_URI_TEST;
const hours = (h) => new Date(Date.now() + h * 3600000).toISOString();
const api = () => request(app);

describe.skipIf(!uri)('API integration (test DB)', () => {
  let admin, user, other, slot;
  const login = async (email, password) => (await api().post('/api/auth/login').send({ email, password })).body.data.token;

  beforeAll(async () => {
    await mongoose.connect(uri);
    // Safety: never run destructive cleanup on a non-test database.
    if (!/test/i.test(mongoose.connection.name)) throw new Error(`Refusing to run on database "${mongoose.connection.name}": name must contain "test"`);
    await mongoose.connection.dropDatabase();
    await Promise.all([User.init(), ParkingSlot.init(), Booking.init()]);
    const hash = await bcrypt.hash('Passw0rd!', 4);
    await User.create([{ name: 'Admin', email: 'admin@t.io', passwordHash: hash, role: 'admin' }, { name: 'U1', email: 'u1@t.io', passwordHash: hash }, { name: 'U2', email: 'u2@t.io', passwordHash: hash }]);
    admin = await login('admin@t.io', 'Passw0rd!'); user = await login('u1@t.io', 'Passw0rd!'); other = await login('u2@t.io', 'Passw0rd!');
    slot = (await api().post('/api/slots').set('Authorization', `Bearer ${admin}`).send({ slotNumber: 'A-01', facility: 'Test Garage', floor: 1, zone: 'A', hourlyRate: 50 })).body.data;
  });
  afterAll(async () => { await mongoose.connection.dropDatabase(); await mongoose.disconnect(); });

  const book = (token, over = {}) => api().post('/api/bookings').set('Authorization', `Bearer ${token}`)
    .send({ slotId: slot._id, vehicleNumber: 'RJ14AB1234', startTime: hours(2), endTime: hours(4), ...over });

  describe('auth', () => {
    it('registers a user and ignores a client-supplied role', async () => {
      const res = await api().post('/api/auth/register').send({ name: 'Eve', email: 'eve@t.io', password: 'Passw0rd!', role: 'admin' });
      expect(res.status).toBe(201); expect(res.body.data.user.role).toBe('user');
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });
    it('rejects duplicate email with 409', async () => {
      expect((await api().post('/api/auth/register').send({ name: 'Eve', email: 'eve@t.io', password: 'Passw0rd!' })).status).toBe(409);
    });
    it('rejects wrong password with 401', async () => {
      expect((await api().post('/api/auth/login').send({ email: 'u1@t.io', password: 'wrong-pass' })).status).toBe(401);
    });
    it('GET /auth/me returns the current user', async () => {
      expect((await api().get('/api/auth/me').set('Authorization', `Bearer ${user}`)).body.data.user.email).toBe('u1@t.io');
    });
  });

  describe('slots CRUD, roles, filtering, pagination', () => {
    it('forbids non-admin slot creation (403)', async () => {
      expect((await api().post('/api/slots').set('Authorization', `Bearer ${user}`).send({})).status).toBe(403);
    });
    it('rejects invalid slot data (400) and duplicate slot (409)', async () => {
      expect((await api().post('/api/slots').set('Authorization', `Bearer ${admin}`).send({ slotNumber: 'X' })).status).toBe(400);
      expect((await api().post('/api/slots').set('Authorization', `Bearer ${admin}`).send({ slotNumber: 'A-01', facility: 'Test Garage', floor: 1, zone: 'A', hourlyRate: 10 })).status).toBe(409);
    });
    it('filters and paginates', async () => {
      for (let i = 2; i <= 6; i++) await api().post('/api/slots').set('Authorization', `Bearer ${admin}`).send({ slotNumber: `A-0${i}`, facility: 'Test Garage', floor: 2, zone: 'B', vehicleType: 'ev', hourlyRate: 70 });
      const res = await api().get('/api/slots?floor=2&vehicleType=ev&limit=2&page=2').set('Authorization', `Bearer ${user}`);
      expect(res.body.meta).toMatchObject({ page: 2, limit: 2, total: 5, totalPages: 3 }); expect(res.body.data).toHaveLength(2);
    });
    it('updates a slot, 400 on invalid id, 404 on missing', async () => {
      expect((await api().put(`/api/slots/${slot._id}`).set('Authorization', `Bearer ${admin}`).send({ hourlyRate: 55 })).body.data.hourlyRate).toBe(55);
      expect((await api().get('/api/slots/not-an-id').set('Authorization', `Bearer ${user}`)).status).toBe(400);
      expect((await api().get('/api/slots/507f1f77bcf86cd799439011').set('Authorization', `Bearer ${user}`)).status).toBe(404);
    });
  });

  describe('bookings', () => {
    it('rejects past start, end<=start and bad vehicle number', async () => {
      expect((await book(user, { startTime: hours(-1), endTime: hours(1) })).status).toBe(400);
      expect((await book(user, { startTime: hours(5), endTime: hours(4) })).status).toBe(400);
      expect((await book(user, { vehicleNumber: '!' })).status).toBe(400);
    });
    it('creates a booking with the right amount, then blocks overlaps and allows back-to-back', async () => {
      const first = await book(user, { startTime: hours(10), endTime: hours(12) });
      expect(first.status).toBe(201); expect(first.body.data.calculatedAmount).toBe(110);
      expect((await book(other, { startTime: hours(11), endTime: hours(13) })).status).toBe(409); // partial overlap
      expect((await book(other, { startTime: hours(9), endTime: hours(13) })).status).toBe(409);  // contains
      expect((await book(other, { startTime: hours(12), endTime: hours(14) })).status).toBe(201); // touching boundary is OK
    });
    it('excludes booked slots from availability search', async () => {
      const res = await api().get(`/api/slots?facility=Test%20Garage&floor=1&startTime=${hours(10.5)}&endTime=${hours(11.5)}`).set('Authorization', `Bearer ${user}`);
      expect(res.body.data.find((s) => s._id === slot._id)).toBeUndefined();
    });
    it('exactly one of many concurrent overlapping requests succeeds', async () => {
      const tokens = [user, other, user, other, user, other];
      const results = await Promise.all(tokens.map((t) => book(t, { startTime: hours(30), endTime: hours(32) })));
      const statuses = results.map((r) => r.status);
      expect(statuses.filter((s) => s === 201)).toHaveLength(1);
      expect(statuses.filter((s) => s === 409)).toHaveLength(tokens.length - 1);
      expect(await Booking.countDocuments({ slotId: slot._id, startTime: new Date(hours(30)) })).toBeLessThanOrEqual(1);
    });
    it('hides other users\' bookings and forbids foreign cancellation', async () => {
      const b = (await book(user, { startTime: hours(50), endTime: hours(51) })).body.data;
      expect((await api().get(`/api/bookings/${b._id}`).set('Authorization', `Bearer ${other}`)).status).toBe(404);
      expect((await api().patch(`/api/bookings/${b._id}/cancel`).set('Authorization', `Bearer ${other}`)).status).toBe(404);
      const otherId = (await api().get('/api/auth/me').set('Authorization', `Bearer ${other}`)).body.data.user.id;
      const mine = (await api().get('/api/bookings?limit=100').set('Authorization', `Bearer ${other}`)).body.data;
      expect(mine.every((x) => x.userId === otherId)).toBe(true); // list is scoped to the caller
      expect((await api().patch(`/api/bookings/${b._id}/cancel`).set('Authorization', `Bearer ${user}`)).body.data.status).toBe('cancelled');
      expect((await api().patch(`/api/bookings/${b._id}/cancel`).set('Authorization', `Bearer ${user}`)).status).toBe(409);
      expect((await book(other, { startTime: hours(50), endTime: hours(51) })).status).toBe(201); // cancelled booking frees the slot
    });
    it('check-in too early is rejected', async () => {
      const b = (await book(user, { startTime: hours(70), endTime: hours(71) })).body.data;
      expect((await api().patch(`/api/bookings/${b._id}/check-in`).set('Authorization', `Bearer ${user}`)).status).toBe(409);
    });
  });

  describe('admin and slot deletion policy', () => {
    it('blocks non-admins from admin routes, serves stats/users/audit logs to admins', async () => {
      expect((await api().get('/api/admin/stats').set('Authorization', `Bearer ${user}`)).status).toBe(403);
      expect((await api().get('/api/admin/stats').set('Authorization', `Bearer ${admin}`)).body.data.totalSlots).toBeGreaterThan(0);
      const users = await api().get('/api/admin/users').set('Authorization', `Bearer ${admin}`);
      expect(users.body.data.every((u) => u.passwordHash === undefined)).toBe(true);
      expect((await api().get('/api/admin/audit-logs').set('Authorization', `Bearer ${admin}`)).body.meta.total).toBeGreaterThan(0);
    });
    it('refuses to delete a slot with active bookings (409)', async () => {
      expect((await api().delete(`/api/slots/${slot._id}`).set('Authorization', `Bearer ${admin}`)).status).toBe(409);
    });
    it('hard-deletes an unused slot', async () => {
      const s = (await api().post('/api/slots').set('Authorization', `Bearer ${admin}`).send({ slotNumber: 'Z-99', facility: 'Test Garage', floor: 3, zone: 'Z', hourlyRate: 10 })).body.data;
      expect((await api().delete(`/api/slots/${s._id}`).set('Authorization', `Bearer ${admin}`)).body.data.deleted).toBe(true);
    });
  });

  describe('indexes', () => {
    it('defines the expected indexes on bookings', async () => {
      const keys = (await Booking.collection.indexes()).map((i) => Object.keys(i.key).join(','));
      expect(keys).toEqual(expect.arrayContaining(['bookingReference', 'userId,startTime', 'slotId,startTime', 'status,createdAt', 'vehicleNumber']));
    });
  });
});
