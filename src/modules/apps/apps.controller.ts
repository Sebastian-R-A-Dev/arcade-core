import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { appsService } from './apps.service.js';
import type { CreateAppBody, UpdateAppBody } from './apps.validation.js';

export const appsController = {
  async create(
    req: Request<unknown, unknown, CreateAppBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await appsService.createApp(req.body);
      res.status(HttpError.CREATED).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await appsService.listApps();
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async updateById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const data = await appsService.updateApp(id, req.body as UpdateAppBody);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async removeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      await appsService.deleteApp(id);
      res.json({ data: { deleted: true, id } });
    } catch (err) {
      next(err);
    }
  },
};
