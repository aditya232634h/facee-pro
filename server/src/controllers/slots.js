import ParkingSlot, { VEHICLE_TYPES } from '../models/ParkingSlot.js';
import Booking, { BLOCKING_STATUSES } from '../models/Booking.js';
import { ApiError, asyncHandler, ok, paginate, pageMeta, parseSort, logAudit } from '../utils/helpers.js';

const SLOT_FIELDS = ['slotNumber', 'facility', 'floor', 'zone', 'vehicleType', 'status', 'hourlyRate'];
const pick = (body) => Object.fromEntries(SLOT_FIELDS.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

export const createSlot = asyncHandler(async (req, res) => {
  const slot = await ParkingSlot.create(pick(req.body));
  await logAudit(req.user._id, 'slot.create', 'ParkingSlot', slot._id, { slotNumber: slot.slotNumber, facility: slot.facility });
  ok(res, slot, 201);
});

export const listSlots = asyncHandler(async (req, res) => {
  const { facility, floor, zone, vehicleType, status, startTime, endTime } = req.query;
  const all = req.query.availability === 'all'; // map mode: keep busy slots, annotate each with live availability
  const filter = {};
  if (facility) filter.facility = facility;
  if (zone) filter.zone = zone;
  if (vehicleType) filter.vehicleType = vehicleType;
  if (status) filter.status = status;
  if (floor !== undefined && floor !== '') filter.floor = Number(floor);
  let s, e;
  if (startTime && endTime) {
    s = new Date(startTime); e = new Date(endTime);
    if (Number.isNaN(s) || Number.isNaN(e) || e <= s) throw new ApiError(400, 'Invalid startTime/endTime window', 'VALIDATION_ERROR');
    if (!all) { // availability search: exclude slots with an overlapping blocking booking
      const busy = await Booking.distinct('slotId', { status: { $in: BLOCKING_STATUSES }, startTime: { $lt: e }, endTime: { $gt: s } });
      filter._id = { $nin: busy };
      if (!status) filter.status = { $ne: 'maintenance' };
    }
  }
  const { page, limit, skip } = paginate(req.query);
  const sort = parseSort(req.query.sort, ['slotNumber', 'floor', 'hourlyRate', 'createdAt'], { facility: 1, floor: 1, slotNumber: 1 });
  const [rows, total] = await Promise.all([
    ParkingSlot.find(filter).sort(sort).skip(skip).limit(limit), ParkingSlot.countDocuments(filter)]);
  let items = rows;
  if (all && s) {
    const overlaps = await Booking.find({ slotId: { $in: rows.map((r) => r._id) }, status: { $in: BLOCKING_STATUSES }, startTime: { $lt: e }, endTime: { $gt: s } }).select('slotId status');
    const byslot = new Map(overlaps.map((b) => [b.slotId.toString(), b.status]));
    items = rows.map((r) => {
      const st = byslot.get(r._id.toString());
      return { ...r.toObject(), availability: r.status === 'maintenance' ? 'maintenance' : st === 'checked_in' ? 'occupied' : st ? 'reserved' : 'available' };
    });
  }
  ok(res, items, 200, pageMeta(page, limit, total));
});

export const slotMeta = asyncHandler(async (_req, res) => {
  const [facilities, zones, floors] = await Promise.all([ParkingSlot.distinct('facility'), ParkingSlot.distinct('zone'), ParkingSlot.distinct('floor')]);
  ok(res, { facilities: facilities.sort(), zones: zones.sort(), floors: floors.sort((a, b) => a - b), vehicleTypes: VEHICLE_TYPES });
});

// Public, real numbers only (computed live from the database).
export const publicStats = asyncHandler(async (_req, res) => {
  const now = new Date();
  const busy = await Booking.distinct('slotId', { status: { $in: BLOCKING_STATUSES }, startTime: { $lte: now }, endTime: { $gt: now } });
  const [totalSlots, availableNow, facilities] = await Promise.all([
    ParkingSlot.countDocuments({ status: { $ne: 'maintenance' } }),
    ParkingSlot.countDocuments({ status: { $ne: 'maintenance' }, _id: { $nin: busy } }),
    ParkingSlot.aggregate([{ $group: { _id: '$facility', slots: { $sum: 1 } } }, { $sort: { _id: 1 } }])]);
  ok(res, { totalSlots, availableNow, facilities: facilities.map((f) => ({ name: f._id, slots: f.slots })) });
});

export const getSlot = asyncHandler(async (req, res) => {
  const slot = await ParkingSlot.findById(req.params.id);
  if (!slot) throw new ApiError(404, 'Parking slot not found', 'NOT_FOUND');
  ok(res, slot);
});

export const updateSlot = asyncHandler(async (req, res) => {
  const slot = await ParkingSlot.findByIdAndUpdate(req.params.id, pick(req.body), { returnDocument: 'after', runValidators: true });
  if (!slot) throw new ApiError(404, 'Parking slot not found', 'NOT_FOUND');
  await logAudit(req.user._id, 'slot.update', 'ParkingSlot', slot._id, { fields: Object.keys(pick(req.body)) });
  ok(res, slot);
});

// Safe deletion policy: active/future bookings -> 409; booking history -> deactivate (maintenance); none -> hard delete.
export const deleteSlot = asyncHandler(async (req, res) => {
  const slot = await ParkingSlot.findById(req.params.id);
  if (!slot) throw new ApiError(404, 'Parking slot not found', 'NOT_FOUND');
  const active = await Booking.exists({ slotId: slot._id, status: { $in: BLOCKING_STATUSES }, endTime: { $gt: new Date() } });
  if (active) throw new ApiError(409, 'Slot has active or upcoming bookings; cancel them first', 'SLOT_HAS_BOOKINGS');
  if (await Booking.exists({ slotId: slot._id })) {
    slot.status = 'maintenance'; await slot.save();
    await logAudit(req.user._id, 'slot.deactivate', 'ParkingSlot', slot._id);
    return ok(res, { deleted: false, deactivated: true, slot });
  }
  await slot.deleteOne();
  await logAudit(req.user._id, 'slot.delete', 'ParkingSlot', slot._id);
  ok(res, { deleted: true });
});
