import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import type { ListAudiosQuery, UploadAudioParsedBody } from './audio.validation.js';
import { listAppAudios, uploadAppAudio } from './audio.service.js';

export const audiosController = {
  async list(
    req: Request<unknown, unknown, unknown, ListAudiosQuery>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await listAppAudios(req.query.q ?? '');
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError(
          'Missing audio file: send multipart field named "audio"',
          HttpError.BAD_REQUEST,
        );
      }
      const body = req.body as UploadAudioParsedBody;
      const data = await uploadAppAudio({
        buffer: req.file.buffer,
        mimetype: req.file.mimetype,
        originalname: req.file.originalname,
        labelFromBody: body.labelFromBody,
      });
      res.status(HttpError.CREATED).json({ data });
    } catch (err) {
      next(err);
    }
  },
};
