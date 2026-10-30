import Booking from '../models/Booking.js';
import * as svc from '../services/bookingService.js';
import { ApiError, asyncHandler, ok, paginate, pageMeta, parseSort, escapeRegex, logAudit } from '../utils/helpers.js';

const isAdmin = (u) => u.role === 'admin';

// Owner-or-admin access. Non-owners get 404 so booking ids are not discoverable.
async function loadOwned(req) {
  const b = await Booking.findById(req.params.id);
  if (!b || (!isAdmin(req.user) && !b.userId.equals(req.user._id))) throw new ApiError(404, 'Booking not found', 'NOT_FOUND');
  return b;
}

export const createBooking = asyncHandler(async (req, res) => {
  const { slotId, vehicleNumber, startTime, endTime } = req.body;
  const b = await svc.createBooking({ userId: req.user._id, slotId, vehicleNumber, startTime, endTime });
  await logAudit(req.user._id, 'booking.create', 'Booking', b._id, { bookingReference: b.bookingReference });
  ok(res, b, 201);
});

export const listBookings = asyncHandler(async (req, res) => {
  const { status, vehicleNumber, from, to, userId } = req.query;
  const filter = isAdmin(req.user) ? {} : { userId: req.user._id }; // users can only ever see their own
  if (isAdmin(req.user) && userId) filter.userId = userId;
  if (status) filter.status = status;
  if (vehicleNumber) filter.vehicleNumber = new RegExp(`^${escapeRegex(vehicleNumber.toUpperCase())}`);
  if (from || to) filter.startTime = { ...(from && { $gte: new Date(from) }), ...(to && { $lte: new Date(to) }) };
  const { page, limit, skip } = paginate(req.query);
  const sort = parseSort(req.query.sort, ['startTime', 'createdAt', 'calculatedAmount'], { startTime: -1 });
  let q = Booking.find(filter).sort(sort).skip(skip).limit(limit).populate('slotId', 'slotNumber facility floor zone');
  if (isAdmin(req.user)) q = q.populate('userId', 'name email');
  const [items, total] = await Promise.all([q, Booking.countDocuments(filter)]);
  ok(res, items, 200, pageMeta(page, limit, total));
});

export const getBooking = asyncHandler(async (req, res) => {
  const b = await loadOwned(req);
  await b.populate('slotId', 'slotNumber facility floor zone hourlyRate');
  ok(res, b);
});

const action = (name, fn) => asyncHandler(async (req, res) => {
  const b = await fn(await loadOwned(req));
  await logAudit(req.user._id, `booking.${name}`, 'Booking', b._id);
  ok(res, b);
});
export const cancel = action('cancel', svc.cancelBooking);
export const checkIn = action('check-in', svc.checkIn);
export const checkOut = action('check-out', svc.checkOut);
