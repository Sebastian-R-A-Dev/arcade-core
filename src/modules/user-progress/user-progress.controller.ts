import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { userProgressService } from './user-progress.service.js';
import type { AdminSetUserProgressBody } from './user-progress.validation.js';

export const userProgressController = {
  async listAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await userProgressService.listForAdmin();
      res.status(HttpError.OK).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async setLevelForUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const userId = Number(req.params.id);
      const data = await userProgressService.updateForAdmin(
        userId,
        req.body as AdminSetUserProgressBody,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
};
