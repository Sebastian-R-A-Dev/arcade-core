import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { difficultiesService } from './difficulties.service.js';

export const difficultiesPlayerController = {
  async listForMyApp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        next(new AppError('Unauthorized', HttpError.UNAUTHORIZED));
        return;
      }
      const data = await difficultiesService.listByApp({
        app_id: req.user.appId,
        include_inactive: 'false',
      });
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
};
