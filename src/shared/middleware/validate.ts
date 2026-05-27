import type { RequestHandler } from 'express';
import type { ZodTypeAny } from 'zod';
import { HttpError } from '../constants/httpError.js';

export function validateBody<S extends ZodTypeAny>(schema: S): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(HttpError.BAD_REQUEST).json({
        error: {
          message: 'Validation failed',
          details: parsed.error.flatten(),
        },
      });
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery<S extends ZodTypeAny>(schema: S): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      res.status(HttpError.BAD_REQUEST).json({
        error: {
          message: 'Validation failed',
          details: parsed.error.flatten(),
        },
      });
      return;
    }
    req.query = parsed.data as typeof req.query;
    next();
  };
}

export function validateParams<S extends ZodTypeAny>(schema: S): RequestHandler {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      res.status(HttpError.BAD_REQUEST).json({
        error: {
          message: 'Validation failed',
          details: parsed.error.flatten(),
        },
      });
      return;
    }
    req.params = parsed.data as typeof req.params;
    next();
  };
}
