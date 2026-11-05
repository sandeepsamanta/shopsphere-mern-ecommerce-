import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyToken } from '../utils/token.js';

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError('Not authenticated', 401);

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new AppError('Session expired or invalid. Please log in again.', 401);
  }

  const user = await User.findById(payload.id);
  if (!user) throw new AppError('User no longer exists', 401);
  req.user = user;
  next();
});

export const adminOnly = (req, _res, next) => {
  if (req.user?.role !== 'admin') return next(new AppError('Admin access required', 403));
  next();
};
