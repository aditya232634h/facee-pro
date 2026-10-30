import mongoose from 'mongoose';

// Lifecycle: confirmed -> checked_in -> completed ; confirmed -> cancelled ; confirmed -> no_show
// Only BLOCKING_STATUSES block a slot for an overlapping interval.
export const BLOCKING_STATUSES = ['confirmed', 'checked_in'];
export const BOOKING_STATUSES = [...BLOCKING_STATUSES, 'completed', 'cancelled', 'no_show'];

const bookingSchema = new mongoose.Schema(
  {
    bookingReference: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSlot', required: true },
    vehicleNumber: { type: String, required: true, uppercase: true, trim: true },
    startTime: { type: Date, required: true },
    endTime: {
      type: Date,
      required: true,
      validate: { validator(v) { return v > this.startTime; }, message: 'endTime must be after startTime' },
    },
    status: { type: String, enum: BOOKING_STATUSES, default: 'confirmed' },
    calculatedAmount: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

bookingSchema.index({ userId: 1, startTime: -1 });
bookingSchema.index({ slotId: 1, startTime: 1 });
bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ vehicleNumber: 1 });

export default mongoose.model('Booking', bookingSchema);
