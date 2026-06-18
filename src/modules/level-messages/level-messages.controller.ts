import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { levelMessagesService } from './level-messages.service.js';
import type {
  AdminCreateLevelMessageBody,
  AdminLevelMessageMutationQuery,
  AdminListLevelMessagesQuery,
  AdminUpsertLevelMessageBody,
  ResolveLevelMessageQuery,
} from './level-messages.validation.js';

export const levelMessagesController = {
  async resolve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { level, app_name } = req.query as unknown as ResolveLevelMessageQuery;
      const message = await levelMessagesService.resolveForPlayerLevelByAppName(level, app_name);
      res.json({
        data: {
          level,
          app_name,
          message,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async listAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { app_id } = req.query as unknown as AdminListLevelMessagesQuery;
      const data = await levelMessagesService.listForAdmin(app_id);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async upsertAdmin(
    req: Request<{ level: string }, unknown, AdminUpsertLevelMessageBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const level = Number(req.params.level);
      const { app_id } = req.query as unknown as AdminLevelMessageMutationQuery;
      const data = await levelMessagesService.upsertForAdmin(app_id, level, req.body.message);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async createAdmin(
    req: Request<unknown, unknown, AdminCreateLevelMessageBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await levelMessagesService.upsertForAdmin(
        req.body.app_id,
        req.body.level,
        req.body.message,
      );
      res.status(HttpError.CREATED).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async deleteAdmin(
    req: Request<{ level: string }>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { app_id } = req.query as unknown as AdminLevelMessageMutationQuery;
      await levelMessagesService.deleteForAdmin(app_id, Number(req.params.level));
      res.status(HttpError.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  },
};
