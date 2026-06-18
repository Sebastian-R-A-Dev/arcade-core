import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { AppType } from '@prisma/client';
import { appsRepository } from '../../modules/apps/apps.repository.js';
import { HttpError } from '../constants/httpError.js';
import { AppError } from '../utils/AppError.js';

async function requireChatAppHandler(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) {
    next(new AppError('Unauthorized', HttpError.UNAUTHORIZED));
    return;
  }

  const app = await appsRepository.findById(req.user.appId);
  if (!app || app.type !== AppType.chat) {
    next(new AppError('This endpoint requires a chat app token', HttpError.FORBIDDEN));
    return;
  }

  next();
}

export const requireChatApp: RequestHandler = (req, res, next) => {
  void requireChatAppHandler(req, res, next).catch(next);
};
