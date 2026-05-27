import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { questionsService } from './questions.service.js';
import type {
  AdminListQuestionsQuery,
  CreateQuestionBody,
  MyQuestionsQuery,
  UpdateQuestionBody,
} from './questions.validation.js';

export const questionsController = {
  async create(
    req: Request<unknown, unknown, CreateQuestionBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await questionsService.createQuestion(req.body);
      res.status(HttpError.CREATED).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async updateById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const data = await questionsService.updateQuestion(id, req.body as UpdateQuestionBody);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async removeById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      await questionsService.deleteQuestion(id);
      res.json({ data: { deleted: true, id } });
    } catch (err) {
      next(err);
    }
  },

  async listAdmin(
    req: Request<unknown, unknown, unknown, AdminListQuestionsQuery>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { data, meta } = await questionsService.listQuestionsAdmin(req.query);
      res.json({ data, meta });
    } catch (err) {
      next(err);
    }
  },

  async listForMyApp(
    req: Request<unknown, unknown, unknown, MyQuestionsQuery>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        next(new AppError('Unauthorized', HttpError.UNAUTHORIZED));
        return;
      }
      const data = await questionsService.listQuestionsForApp(req.user.appId, req.query);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async randomForMyApp(
    req: Request<unknown, unknown, unknown, MyQuestionsQuery>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        next(new AppError('Unauthorized', HttpError.UNAUTHORIZED));
        return;
      }
      const data = await questionsService.randomQuestionForApp(req.user.appId, req.query);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
};
