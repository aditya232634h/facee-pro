import crypto from 'node:crypto';
import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';

export class ApiError extends Error {
  constructor(status, message, code = 'ERROR', details) {
    super(message);
    this.status = status; this.code = code; this.details = details;
  }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const ok = (res, data, status = 200, meta) =>
  res.status(status).json({ success: true, data, ...(meta && { meta }) });

export function paginate(query, { maxLimit = 100 } = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
}

export const pageMeta = (page, limit, total) => ({ page, limit, total, totalPages: Math.ceil(total / limit) || 1 });

// Whitelisted sort: "?sort=-startTime" -> { startTime: -1 }
export function parseSort(sort, allowed, fallback) {
  if (!sort) return fallback;
  const dir = sort.startsWith('-') ? -1 : 1;
  const field = sort.replace(/^-/, '');
  return allowed.includes(field) ? { [field]: dir } : fallback;
}

export const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const isObjectId = (v) => mongoose.isValidObjectId(v);

export const newBookingReference = () => `PE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

export async function logAudit(actorId, action, entityType, entityId, metadata) {
  try { await AuditLog.create({ actorId, action, entityType, entityId, metadata }); }
  catch (e) { console.error('audit log failed:', e.message); } // auditing must never break the request
}
