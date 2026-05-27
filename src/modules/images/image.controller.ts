import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import type { DeleteImageBody } from './image.validation.js';
import { deleteStoredImage } from './image.service.js';

export const imageController = {
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body as DeleteImageBody;
      await deleteStoredImage(body.path);
      res.status(HttpError.OK).json({
        data: { deleted: true, path: body.path },
      });
    } catch (err) {
      next(err);
    }
  },
};
