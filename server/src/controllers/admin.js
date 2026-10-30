import mongoose from 'mongoose';
import User from '../models/User.js';
import ParkingSlot from '../models/ParkingSlot.js';
import Booking from '../models/Booking.js';
import AuditLog from '../models/AuditLog.js';
import { ApiError, asyncHandler, ok, paginate, pageMeta, escapeRegex, logAudit } from '../utils/helpers.js';

const countBy = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));

export const stats = asyncHandler(async (_req, res) => {
  const now = new Date();
  const [slotRows, bookingRows, upcoming, users, perDay] = await Promise.all([
    ParkingSlot.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Booking.countDocuments({ status: 'confirmed', startTime: { $gt: now } }),
    User.countDocuments(),
    Booking.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 14 * 86400000) } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }]),
  ]);
  const slots = countBy(slotRows), bookings = countBy(bookingRows);
  const totalSlots = Object.values(slots).reduce((a, b) => a + b, 0);
  // Live state right now, derived from bookings (the slot record's own status is administrative).
  const [occupiedNow, reservedNow] = await Promise.all([
    Booking.distinct('slotId', { status: 'checked_in', endTime: { $gt: now } }).then((a) => a.length),
    Booking.distinct('slotId', { status: 'confirmed', startTime: { $lte: now }, endTime: { $gt: now } }).then((a) => a.length)]);
  ok(res, { totalSlots, slotsByStatus: slots, bookingsByStatus: bookings, upcomingBookings: upcoming,
    activeBookings: bookings.checked_in || 0, totalUsers: users,
    occupiedNow, reservedNow, occupancyRate: totalSlots ? Number(((occupiedNow / totalSlots) * 100).toFixed(1)) : 0,
    bookingsPerDay: perDay.map((d) => ({ date: d._id, count: d.count })) });
});

export const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.q) { const r = new RegExp(escapeRegex(req.query.q), 'i'); filter.$or = [{ name: r }, { email: r }]; }
  const { page, limit, skip } = paginate(req.query);
  const [items, total] = await Promise.all([User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit), User.countDocuments(filter)]);
  ok(res, items, 200, pageMeta(page, limit, total)); // passwordHash is select:false, never returned
});

export const updateUserRole = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) throw new ApiError(400, 'You cannot change your own role', 'VALIDATION_ERROR');
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { returnDocument: 'after', runValidators: true });
  if (!user) throw new ApiError(404, 'User not found', 'NOT_FOUND');
  await logAudit(req.user._id, 'user.role-change', 'User', user._id, { role: user.role });
  ok(res, user);
});

export const auditLogs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.entityType) filter.entityType = req.query.entityType;
  const { page, limit, skip } = paginate(req.query);
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ timestamp: -1 }).skip(skip).limit(limit).populate('actorId', 'name email'), AuditLog.countDocuments(filter)]);
  ok(res, items, 200, pageMeta(page, limit, total));
});

const planStage = (e) => { const j = JSON.stringify(e.queryPlanner?.winningPlan || {}); return j.includes('IXSCAN') ? 'IXSCAN' : j.includes('COLLSCAN') ? 'COLLSCAN' : 'OTHER'; };

// Live database facts for the admin "Database" page. Nothing here is hard-coded or estimated.
export const dbInfo = asyncHandler(async (_req, res) => {
  const db = mongoose.connection.db;
  const out = { database: db.databaseName, collections: [], sampleQueries: [] };
  for (const name of ['users', 'parkingslots', 'bookings', 'auditlogs']) {
    const col = db.collection(name);
    const [indexes, count] = await Promise.all([col.indexes().catch(() => []), col.estimatedDocumentCount().catch(() => null)]);
    out.collections.push({ name, count, indexes: indexes.map((i) => ({ name: i.name, key: i.key, unique: !!i.unique })) });
  }
  try {
    const h = await db.admin().command({ hello: 1 });
    out.replication = { isReplicaSet: !!h.setName, setName: h.setName || null, primary: h.primary || null, me: h.me || null, hosts: h.hosts || [], secondaries: (h.hosts || []).filter((x) => x !== h.primary) };
  } catch (err) { out.replication = { error: err.message }; }
  const samples = [
    ['Bookings by status, newest first', Booking.find({ status: 'confirmed' }).sort({ createdAt: -1 }).limit(20)],
    ['Slot overlap check', Booking.find({ slotId: new mongoose.Types.ObjectId(), status: { $in: ['confirmed', 'checked_in'] }, startTime: { $lt: new Date() }, endTime: { $gt: new Date() } })],
    ['Vehicle number lookup', Booking.find({ vehicleNumber: 'RJ14AB1234' })],
  ];
  for (const [label, q] of samples) {
    try { const e = await q.explain('executionStats'); out.sampleQueries.push({ label, stage: planStage(e), docsExamined: e.executionStats.totalDocsExamined, keysExamined: e.executionStats.totalKeysExamined, returned: e.executionStats.nReturned, millis: e.executionStats.executionTimeMillis }); }
    catch (err) { out.sampleQueries.push({ label, error: err.message }); }
  }
  ok(res, out);
});
