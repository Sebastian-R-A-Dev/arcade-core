import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { rolesService } from './roles.service.js';

export const rolesController = {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await rolesService.list();
      res.status(HttpError.OK).json({ data });
    } catch (err) {
      next(err);
    }
  },
};
