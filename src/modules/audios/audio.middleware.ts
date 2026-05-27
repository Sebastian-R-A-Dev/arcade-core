import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { HttpError } from '../../shared/constants/httpError.js';

export function handleMulterAudioError(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      console.warn('[audios] upload rejected: file too large');
      res.status(HttpError.BAD_REQUEST).json({
        error: { message: 'File exceeds maximum size of 15MB' },
      });
      return;
    }
    console.warn('[audios] multer error:', err.code, err.message);
    res.status(HttpError.BAD_REQUEST).json({
      error: { message: err.message || 'Upload rejected' },
    });
    return;
  }
  if (err instanceof Error) {
    console.warn('[audios] upload error:', err.message);
    res.status(HttpError.BAD_REQUEST).json({
      error: { message: err.message },
    });
    return;
  }
  next(err);
}
