import mongoose from 'mongoose';
import Booking, { BLOCKING_STATUSES } from '../models/Booking.js';
import ParkingSlot from '../models/ParkingSlot.js';
import { ApiError, newBookingReference } from '../utils/helpers.js';

const MAX_HOURS = 24;
const CHECK_IN_EARLY_MS = 15 * 60 * 1000;

export const overlapFilter = (slotId, start, end) => ({
  slotId, status: { $in: BLOCKING_STATUSES }, startTime: { $lt: end }, endTime: { $gt: start }, // newStart < existingEnd AND newEnd > existingStart
});

/**
 * Concurrency strategy: a unique index cannot express time-range overlap, so each booking
 * runs in a transaction that FIRST writes ($inc) the slot document. Two concurrent
 * transactions for the same slot therefore conflict on that write; MongoDB aborts one
 * (TransientTransactionError), withTransaction retries it, and on retry the overlap
 * check sees the winner's booking and returns 409. Requires a replica set (Atlas or local rs).
 */
export async function createBooking({ userId, slotId, vehicleNumber, startTime, endTime }) {
  const start = new Date(startTime), end = new Date(endTime);
  if (Number.isNaN(start) || Number.isNaN(end)) throw new ApiError(400, 'Invalid date', 'VALIDATION_ERROR');
  if (start <= new Date()) throw new ApiError(400, 'startTime must be in the future', 'VALIDATION_ERROR');
  if (end <= start) throw new ApiError(400, 'endTime must be after startTime', 'VALIDATION_ERROR');
  const hours = Math.ceil((end - start) / 3600000);
  if (hours > MAX_HOURS) throw new ApiError(400, `Bookings cannot exceed ${MAX_HOURS} hours`, 'VALIDATION_ERROR');

  const session = await mongoose.startSession();
  try {
    let booking;
    await session.withTransaction(async () => {
      const slot = await ParkingSlot.findByIdAndUpdate(slotId, { $inc: { bookingSeq: 1 } }, { returnDocument: 'after', session });
      if (!slot) throw new ApiError(404, 'Parking slot not found', 'NOT_FOUND');
      if (slot.status === 'maintenance') throw new ApiError(409, 'Slot is under maintenance', 'SLOT_UNAVAILABLE');
      if (await Booking.exists(overlapFilter(slot._id, start, end)).session(session))
        throw new ApiError(409, 'Slot is already booked for an overlapping time', 'BOOKING_CONFLICT');
      [booking] = await Booking.create([{
        bookingReference: newBookingReference(), userId, slotId: slot._id, vehicleNumber,
        startTime: start, endTime: end, calculatedAmount: hours * slot.hourlyRate,
      }], { session });
    });
    return booking;
  } finally { await session.endSession(); }
}

const transition = async (booking, from, to, message) => {
  if (booking.status !== from) throw new ApiError(409, message, 'INVALID_STATE');
  booking.status = to; await booking.save(); return booking;
};

export const cancelBooking = (b) => transition(b, 'confirmed', 'cancelled', 'Only confirmed bookings can be cancelled');

export function checkIn(b) {
  const now = Date.now();
  if (now < b.startTime.getTime() - CHECK_IN_EARLY_MS) throw new ApiError(409, 'Too early to check in (opens 15 minutes before start)', 'INVALID_STATE');
  if (now >= b.endTime.getTime()) throw new ApiError(409, 'Booking period has ended', 'INVALID_STATE');
  return transition(b, 'confirmed', 'checked_in', 'Only confirmed bookings can be checked in');
}

export const checkOut = (b) => transition(b, 'checked_in', 'completed', 'Only checked-in bookings can be checked out');
