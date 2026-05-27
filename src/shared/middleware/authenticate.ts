import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from '../constants/httpError.js';
import { AppError } from '../utils/AppError.js';

export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Missing or invalid Authorization header', HttpError.UNAUTHORIZED));
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return next(new AppError('Missing or invalid Authorization header', HttpError.UNAUTHORIZED));
  }

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    if (
      typeof payload === 'string' ||
      typeof payload.sub !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.appId !== 'number'
    ) {
      return next(new AppError('Invalid access token', HttpError.UNAUTHORIZED));
    }
    if ('app_name' in payload && typeof payload.app_name !== 'string') {
      return next(new AppError('Invalid access token', HttpError.UNAUTHORIZED));
    }
    const id = Number.parseInt(payload.sub, 10);
    if (!Number.isFinite(id)) {
      return next(new AppError('Invalid access token', HttpError.UNAUTHORIZED));
    }
    const app_name =
      typeof payload.app_name === 'string' && payload.app_name.trim()
        ? payload.app_name.trim()
        : undefined;
    req.user = { id, email: payload.email, appId: payload.appId, app_name };
    next();
  } catch {
    next(new AppError('Invalid or expired access token', HttpError.UNAUTHORIZED));
  }
};
