import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { ApiError, asyncHandler, isObjectId } from '../utils/helpers.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Authentication required', 'UNAUTHENTICATED');
  let payload;
  try { payload = jwt.verify(token, config.jwtSecret); }
  catch { throw new ApiError(401, 'Invalid or expired token', 'UNAUTHENTICATED'); }
  const user = await User.findById(payload.sub); // fresh lookup so role changes apply immediately
  if (!user) throw new ApiError(401, 'User no longer exists', 'UNAUTHENTICATED');
  req.user = user;
  next();
});

export const authorize = (...roles) => (req, _res, next) =>
  roles.includes(req.user?.role) ? next() : next(new ApiError(403, 'You do not have permission to do this', 'FORBIDDEN'));

export const validate = (req, _res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  next(new ApiError(400, 'Validation failed', 'VALIDATION_ERROR',
    result.array().map((e) => ({ field: e.path, message: e.msg }))));
};

export const validateId = (param = 'id') => (req, _res, next) =>
  isObjectId(req.params[param]) ? next() : next(new ApiError(400, `Invalid ${param}`, 'INVALID_ID'));

export const notFound = (req, _res, next) => next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  let { status = 500, message, code = 'INTERNAL_ERROR', details } = err;
  if (err.code === 11000) { status = 409; code = 'DUPLICATE'; message = `Duplicate value for: ${Object.keys(err.keyPattern || {}).join(', ')}`; }
  else if (err.name === 'ValidationError') { status = 400; code = 'VALIDATION_ERROR'; details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })); message = 'Validation failed'; }
  else if (err.name === 'CastError') { status = 400; code = 'INVALID_ID'; message = `Invalid ${err.path}`; }
  if (status >= 500) { console.error(err); if (config.env === 'production') message = 'Internal server error'; }
  res.status(status).json({ success: false, error: { code, message, ...(details && { details }) } });
};
