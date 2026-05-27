import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import {
  getChallengeSessionFromRequest,
  verifyChallengeSession,
} from '../../modules/challenge/challenge.cookies.js';

export function requireChallengeSession(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!req.user) {
    next(new AppError('Unauthorized', HttpError.UNAUTHORIZED));
    return;
  }

  const token = getChallengeSessionFromRequest(req);
  if (!token) {
    next(new AppError('Active challenge session required', HttpError.FORBIDDEN));
    return;
  }

  const payload = verifyChallengeSession(token);
  if (!payload) {
    next(new AppError('Invalid or expired challenge session', HttpError.FORBIDDEN));
    return;
  }

  if (payload.uid !== req.user.id || payload.appId !== req.user.appId) {
    next(new AppError('Challenge session does not match authenticated user', HttpError.FORBIDDEN));
    return;
  }

  req.challengeSession = payload;
  next();
}
