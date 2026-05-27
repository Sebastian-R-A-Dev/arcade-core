import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { usersService } from './users.service.js';
import type { MeQuery } from './users.validation.js';

export const usersController = {
  async me(req: Request<unknown, unknown, unknown, MeQuery>, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        next(new AppError('Unauthorized', HttpError.UNAUTHORIZED));
        return;
      }
      const data = await usersService.getMeForToken({
        userId: req.user.id,
        tokenAppId: req.user.appId,
        expected_app_name: req.query.expected_app_name,
      });
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
};
