import { Router } from 'express';
import { body, query } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { authenticate, authorize, validate, validateId } from '../middleware/index.js';
import { SLOT_STATUSES, VEHICLE_TYPES } from '../models/ParkingSlot.js';
import { BOOKING_STATUSES } from '../models/Booking.js';
import * as auth from '../controllers/auth.js';
import * as slots from '../controllers/slots.js';
import * as bookings from '../controllers/bookings.js';
import * as admin from '../controllers/admin.js';

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many attempts, try again later' } } });

const slotBody = (optional) => {
  const o = (c) => (optional ? c.optional() : c.exists().withMessage('is required'));
  return [
    o(body('slotNumber')).bail().isString().trim().notEmpty().isLength({ max: 20 }),
    o(body('facility')).bail().isString().trim().notEmpty().isLength({ max: 80 }),
    o(body('floor')).bail().isInt({ min: -5, max: 50 }).toInt(),
    o(body('zone')).bail().isString().trim().notEmpty().isLength({ max: 40 }),
    body('vehicleType').optional().isIn(VEHICLE_TYPES),
    body('status').optional().isIn(SLOT_STATUSES),
    o(body('hourlyRate')).bail().isFloat({ min: 0 }).toFloat(),
  ];
};
const paging = [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 100 })];

const r = Router();

r.post('/auth/register', authLimiter,
  body('name').isString().trim().isLength({ min: 2, max: 80 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isString().isLength({ min: 8, max: 72 }).withMessage('must be 8-72 characters'),
  validate, auth.register);
r.post('/auth/login', authLimiter, body('email').isEmail().normalizeEmail(), body('password').isString().notEmpty(), validate, auth.login);
r.get('/auth/me', authenticate, auth.me);
r.patch('/auth/me', authenticate, body('name').optional().isString().trim().isLength({ min: 2, max: 80 }),
  body('newPassword').optional().isString().isLength({ min: 8, max: 72 }), validate, auth.updateMe);
r.get('/public/stats', slots.publicStats);

r.get('/slots', authenticate, paging, query('vehicleType').optional().isIn(VEHICLE_TYPES), query('status').optional().isIn(SLOT_STATUSES), validate, slots.listSlots);
r.get('/slots/meta', authenticate, slots.slotMeta);
r.get('/slots/:id', authenticate, validateId(), slots.getSlot);
r.post('/slots', authenticate, authorize('admin'), slotBody(false), validate, slots.createSlot);
r.put('/slots/:id', authenticate, authorize('admin'), validateId(), slotBody(true), validate, slots.updateSlot);
r.delete('/slots/:id', authenticate, authorize('admin'), validateId(), slots.deleteSlot);

r.post('/bookings', authenticate,
  body('slotId').isMongoId(),
  body('vehicleNumber').isString().trim().matches(/^[A-Za-z0-9 -]{4,15}$/).withMessage('must be 4-15 letters/digits'),
  body('startTime').isISO8601(), body('endTime').isISO8601(), validate, bookings.createBooking);
r.get('/bookings', authenticate, paging, query('status').optional().isIn(BOOKING_STATUSES), query('userId').optional().isMongoId(), validate, bookings.listBookings);
r.get('/bookings/:id', authenticate, validateId(), bookings.getBooking);
r.patch('/bookings/:id/cancel', authenticate, validateId(), bookings.cancel);
r.patch('/bookings/:id/check-in', authenticate, validateId(), bookings.checkIn);
r.patch('/bookings/:id/check-out', authenticate, validateId(), bookings.checkOut);

r.use('/admin', authenticate, authorize('admin'));
r.get('/admin/stats', admin.stats);
r.get('/admin/users', paging, validate, admin.listUsers);
r.patch('/admin/users/:id/role', validateId(), body('role').isIn(['user', 'admin']), validate, admin.updateUserRole);
r.get('/admin/audit-logs', paging, validate, admin.auditLogs);
r.get('/admin/db-info', admin.dbInfo);

export default r;
