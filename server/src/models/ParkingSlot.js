import mongoose from 'mongoose';

export const SLOT_STATUSES = ['available', 'reserved', 'occupied', 'maintenance'];
export const VEHICLE_TYPES = ['car', 'bike', 'ev', 'accessible'];

const slotSchema = new mongoose.Schema(
  {
    slotNumber: { type: String, required: true, trim: true },
    facility: { type: String, required: true, trim: true },
    floor: { type: Number, required: true, min: -5, max: 50 },
    zone: { type: String, required: true, trim: true },
    vehicleType: { type: String, enum: VEHICLE_TYPES, default: 'car' },
    status: { type: String, enum: SLOT_STATUSES, default: 'available' },
    hourlyRate: { type: Number, required: true, min: 0 },
    bookingSeq: { type: Number, default: 0, select: false }, // bumped inside booking transactions to serialize same-slot writes
    // Internal counter bumped inside every booking transaction so concurrent bookings of the same slot conflict.
    bookingVersion: { type: Number, default: 0, select: false },
    bookingSeq: { type: Number, default: 0 }, // bumped inside every booking transaction to serialize concurrent bookings per slot
  },
  { timestamps: true }
);

// A slot number is unique within a facility, not globally.
slotSchema.index({ facility: 1, slotNumber: 1 }, { unique: true });

export default mongoose.model('ParkingSlot', slotSchema);
