import { AppError } from '../utils/errors.js';

export function requireBody(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => req.body[f] === undefined);
    if (missing.length > 0) {
      return next(new AppError(`Missing required fields: ${missing.join(', ')}`, 400));
    }
    next();
  };
}
