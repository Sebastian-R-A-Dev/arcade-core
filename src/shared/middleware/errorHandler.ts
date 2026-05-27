import type { ErrorRequestHandler } from 'express';
import { HttpError } from '../constants/httpError.js';
import { AppError } from '../utils/AppError.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const statusCode =
    err instanceof AppError ? err.statusCode : HttpError.INTERNAL_SERVER_ERROR;
  const message =
    err instanceof AppError
      ? err.message
      : process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err instanceof Error
          ? err.message
          : 'Internal server error';

  if (statusCode === HttpError.INTERNAL_SERVER_ERROR && !(err instanceof AppError)) {
    console.error(err);
  }

  const body: Record<string, unknown> = {
    error: {
      message,
      ...(process.env.NODE_ENV !== 'production' &&
      !(err instanceof AppError) &&
      err instanceof Error
        ? { stack: err.stack }
        : {}),
    },
  };

  res.status(statusCode).json(body);
};
