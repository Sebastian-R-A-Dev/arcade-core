import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { scoresService } from './scores.service.js';
import type { CreateScoreBody } from './scores.validation.js';

export const scoresController = {
  async create(
    req: Request<unknown, unknown, CreateScoreBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await scoresService.recordScore({
        userId: req.user!.id,
        tokenAppId: req.user!.appId,
        app_id: req.body.app_id,
        score: req.body.score,
      });
      res.status(HttpError.CREATED).json({ data });
    } catch (err) {
      next(err);
    }
  },
};
