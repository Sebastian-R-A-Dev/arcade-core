import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { appsRepository } from '../../modules/apps/apps.repository.js';
import { ADMIN_APP_NAME } from '../constants/adminApp.js';
import { HttpError } from '../constants/httpError.js';
import { AppError } from '../utils/AppError.js';

async function requireAdminAppHandler(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    next(new AppError('Unauthorized', HttpError.UNAUTHORIZED));
    return;
  }

  const adminApp = await appsRepository.findByName(ADMIN_APP_NAME);
  if (!adminApp) {
    next(
      new AppError('Admin application is not configured in the database', HttpError.SERVICE_UNAVAILABLE),
    );
    return;
  }

  if (req.user.appId !== adminApp.id) {
    next(new AppError('Access denied: admin endpoints require an ADMIN_APP token', HttpError.FORBIDDEN));
    return;
  }

  next();
}

export const requireAdminApp: RequestHandler = (req, res, next) => {
  void requireAdminAppHandler(req, res, next).catch(next);
};
