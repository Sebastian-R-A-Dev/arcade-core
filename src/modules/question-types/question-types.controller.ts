import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { questionTypesService } from './question-types.service.js';
import type {
  CreateQuestionTypeBody,
  UpdateQuestionTypeBody,
} from './question-types.validation.js';

export const questionTypesController = {
  async create(
    req: Request<unknown, unknown, CreateQuestionTypeBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await questionTypesService.createQuestionType(req.body);
      res.status(HttpError.CREATED).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as { include_inactive?: 'true' | 'false' };
      const data = await questionTypesService.list(query);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async updateById(
    req: Request<{ id: string }, unknown, UpdateQuestionTypeBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const id = Number.parseInt(req.params.id, 10);
      const data = await questionTypesService.updateQuestionType(id, req.body);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async removeById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number.parseInt(req.params.id, 10);
      await questionTypesService.deleteQuestionType(id);
      res.status(HttpError.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  },
};
