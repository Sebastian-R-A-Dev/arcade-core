import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { accountEventsService } from './account-events.service.js';

export const accountEventsController = {
  async listAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await accountEventsService.listForAdmin();
      res.status(HttpError.OK).json({ data });
    } catch (err) {
      next(err);
    }
  },
};
