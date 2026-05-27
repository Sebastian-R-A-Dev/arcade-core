import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import {
  clearChallengeSessionCookie,
  setChallengeSessionCookie,
  signChallengeSession,
} from './challenge.cookies.js';
import { challengeService } from './challenge.service.js';
import type { ChallengeAnswerBody, ChallengeTimeoutBody } from './challenge.validation.js';
import { challengeForfeitSchema } from './challenge.validation.js';

function endCookieIfNeeded(
  res: Response,
  status: 'active' | 'completed' | 'failed',
): void {
  if (status === 'completed' || status === 'failed') {
    clearChallengeSessionCookie(res);
  }
}

export const challengeController = {
  async start(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        next(new AppError('Unauthorized', HttpError.UNAUTHORIZED));
        return;
      }
      const data = await challengeService.startChallenge(req.user.id, req.user.appId);
      const token = signChallengeSession({
        sid: data.session_id,
        uid: req.user.id,
        appId: req.user.appId,
      });
      setChallengeSessionCookie(res, token);
      res.status(HttpError.CREATED).json({ data });
    } catch (err) {
      next(err);
    }
  },

  async spin(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.challengeSession) {
        next(new AppError('Active challenge session required', HttpError.FORBIDDEN));
        return;
      }
      const data = await challengeService.spinQuestion(
        req.user.id,
        req.user.appId,
        req.challengeSession.sid,
      );
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async answer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.challengeSession) {
        next(new AppError('Active challenge session required', HttpError.FORBIDDEN));
        return;
      }
      const body = req.body as ChallengeAnswerBody;
      const data = await challengeService.submitAnswer(
        req.user.id,
        req.user.appId,
        req.challengeSession.sid,
        body,
      );
      endCookieIfNeeded(res, data.status);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async timeout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.challengeSession) {
        next(new AppError('Active challenge session required', HttpError.FORBIDDEN));
        return;
      }
      const body = req.body as ChallengeTimeoutBody;
      const data = await challengeService.submitTimeout(
        req.user.id,
        req.user.appId,
        req.challengeSession.sid,
        body,
      );
      endCookieIfNeeded(res, data.status);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },

  async forfeit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user || !req.challengeSession) {
        next(new AppError('Active challenge session required', HttpError.FORBIDDEN));
        return;
      }
      const raw = req.body && typeof req.body === 'object' ? req.body : {};
      const parsed = challengeForfeitSchema.safeParse(raw);
      const body = parsed.success ? parsed.data : {};
      const data = await challengeService.forfeitChallenge(
        req.user.id,
        req.user.appId,
        req.challengeSession.sid,
        body,
      );
      clearChallengeSessionCookie(res);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
};
