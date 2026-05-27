import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { healthService } from './health.service.js';

export const healthController = {
  live(_req: Request, res: Response, next: NextFunction): void {
    try {
      const data = healthService.getLiveness();
      res.status(HttpError.OK).json(data);
    } catch (err) {
      next(err);
    }
  },

  async database(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await healthService.getDatabaseHealth();
      const statusCode =
        data.database === 'connected' ? HttpError.OK : HttpError.SERVICE_UNAVAILABLE;
      res.status(statusCode).json(data);
    } catch (err) {
      next(err);
    }
  },
};
