import rateLimit from 'express-rate-limit';
import { HttpError } from '../constants/httpError.js';

export const authLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HttpError.TOO_MANY_REQUESTS,
  message: { error: { message: 'Too many login attempts, try again later.' } },
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});

export const authRefreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: HttpError.TOO_MANY_REQUESTS,
  message: { error: { message: 'Too many refresh attempts, try again later.' } },
  handler: (_req, res, _next, options) => {
    res.status(options.statusCode).json(options.message);
  },
});
