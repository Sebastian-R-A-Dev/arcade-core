import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { rolesService } from '../../modules/roles/roles.service.js';
import { HttpError } from '../constants/httpError.js';
import { AppError } from '../utils/AppError.js';

async function requireAdministratorRoleHandler(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    next(new AppError('Unauthorized', HttpError.UNAUTHORIZED));
    return;
  }
  try {
    await rolesService.assertUserIsAdministrator(req.user.id, req.user.appId);
    next();
  } catch (err) {
    next(err);
  }
}

export const requireAdministratorRole: RequestHandler = (req, res, next) => {
  void requireAdministratorRoleHandler(req, res, next).catch(next);
};
