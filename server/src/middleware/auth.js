import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.staff = decoded;
    next();
  } catch (err) {
    next(new AppError('Invalid or expired token', 401));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.staff) {
      return next(new AppError('Authentication required', 401));
    }
    if (!roles.includes(req.staff.role)) {
      return next(new AppError('Insufficient permissions', 403));
    }
    next();
  };
}
