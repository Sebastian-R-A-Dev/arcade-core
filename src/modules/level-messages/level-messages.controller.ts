import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { levelMessagesService } from './level-messages.service.js';
import type {
  AdminCreateLevelMessageBody,
  AdminUpsertLevelMessageBody,
  ResolveLevelMessageQuery,
} from './level-messages.validation.js';

export const levelMessagesController = {
  async resolve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const level = (req.query as unknown as ResolveLevelMessageQuery).level;
      const message = await levelMessagesService.resolveForPlayerLevel(level);
      res.json({
        data: {
          level,
          message,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async listAdmin(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await levelMessagesService.listForAdmin();
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
      const data = await levelMessagesService.upsertForAdmin(level, req.body.message);
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
      const data = await levelMessagesService.upsertForAdmin(req.body.level, req.body.message);
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
      await levelMessagesService.deleteForAdmin(Number(req.params.level));
      res.status(HttpError.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  },
};
