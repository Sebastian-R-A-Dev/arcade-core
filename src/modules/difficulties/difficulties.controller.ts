import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { difficultiesService } from './difficulties.service.js';
import type {
  AdminListDifficultiesQuery,
  CreateDifficultyBody,
  UpdateDifficultyBody,
} from './difficulties.validation.js';

export const difficultiesController = {
  async create(
    req: Request<unknown, unknown, CreateDifficultyBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await difficultiesService.createDifficulty(req.body);
      res.status(HttpError.CREATED).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await difficultiesService.listByApp(
        req.query as unknown as AdminListDifficultiesQuery,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async updateById(
    req: Request<{ id: string }, unknown, UpdateDifficultyBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = Number.parseInt(req.params.id, 10);
      const data = await difficultiesService.updateDifficulty(id, req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async removeById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number.parseInt(req.params.id, 10);
      await difficultiesService.deleteDifficulty(id);
      res.status(HttpError.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  },
};
