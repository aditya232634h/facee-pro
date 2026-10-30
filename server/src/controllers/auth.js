import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { ApiError, asyncHandler, ok } from '../utils/helpers.js';

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt });
const sign = (u) => jwt.sign({ sub: u._id.toString(), role: u.role }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body; // role is deliberately ignored: always 'user'
  const user = await User.create({ name, email, passwordHash: await bcrypt.hash(password, 12), role: 'user' });
  ok(res, { user: publicUser(user), token: sign(user) }, 201);
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  const valid = user && (await bcrypt.compare(req.body.password, user.passwordHash));
  if (!valid) throw new ApiError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
  ok(res, { user: publicUser(user), token: sign(user) });
});

export const me = asyncHandler(async (req, res) => ok(res, { user: publicUser(req.user) }));

export const updateMe = asyncHandler(async (req, res) => {
  const { name, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+passwordHash');
  if (name) user.name = name;
  if (newPassword) {
    if (!currentPassword || !(await bcrypt.compare(currentPassword, user.passwordHash))) throw new ApiError(400, 'Current password is incorrect', 'VALIDATION_ERROR');
    user.passwordHash = await bcrypt.hash(newPassword, 12);
  }
  await user.save();
  ok(res, { user: publicUser(user) });
});
