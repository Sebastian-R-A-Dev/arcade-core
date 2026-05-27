import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { appsRepository } from '../apps/apps.repository.js';
import { usersRepository } from '../users/users.repository.js';
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
} from './auth.cookies.js';
import { authService } from './auth.service.js';
import type {
  CompletePasswordChangeBody,
  LoginBody,
  LogoutBody,
  RefreshBody,
  RegisterBody,
} from './auth.validation.js';

async function resolveAppNameForUser(userId: number, appNameFromToken?: string): Promise<string> {
  if (appNameFromToken?.trim()) return appNameFromToken.trim();
  const user = await usersRepository.findById(userId);
  if (!user) throw new AppError('User not found', HttpError.NOT_FOUND);
  const app = await appsRepository.findById(user.appId);
  if (!app) throw new AppError('App not found', HttpError.NOT_FOUND);
  return app.name;
}

export const authController = {
  async register(
    req: Request<unknown, unknown, RegisterBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await authService.register(req.body);
      const { refresh_token, ...publicPayload } = data;
      setRefreshTokenCookie(res, refresh_token, req.body.app_name.trim());
      res.status(HttpError.CREATED).json({ data: publicPayload });
    } catch (err) {
      next(err);
    }
  },

  async login(
    req: Request<unknown, unknown, LoginBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = await authService.login(req.body);
      const { refresh_token, ...publicPayload } = data;
      setRefreshTokenCookie(res, refresh_token, req.body.app_name.trim());
      res.json({ data: publicPayload });
    } catch (err) {
      next(err);
    }
  },

  async completePasswordChange(
    req: Request<unknown, unknown, CompletePasswordChangeBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Unauthorized', HttpError.UNAUTHORIZED);
      }
      const data = await authService.completePasswordChange(req.user.id, req.body);
      const { refresh_token, ...publicPayload } = data;
      const appName = await resolveAppNameForUser(req.user.id, req.user.app_name);
      setRefreshTokenCookie(res, refresh_token, appName);
      res.json({ data: publicPayload });
    } catch (err) {
      next(err);
    }
  },

  async refresh(
    req: Request<unknown, unknown, RefreshBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const expectedApp = req.body.expected_app_name?.trim();
      const refresh_token =
        getRefreshTokenFromRequest(req, expectedApp) ?? req.body.refresh_token?.trim();
      if (!refresh_token) {
        throw new AppError('Missing refresh session', HttpError.UNAUTHORIZED);
      }
      const tokens = await authService.refresh({
        refresh_token,
        expected_app_name: expectedApp,
      });
      setRefreshTokenCookie(res, tokens.refresh_token, tokens.app_name);
      res.json({
        data: {
          access_token: tokens.access_token,
          expires_in: tokens.expires_in,
        },
      });
    } catch (err) {
      next(err);
    }
  },

  async logout(
    req: Request<unknown, unknown, LogoutBody>,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const expectedApp = req.body.expected_app_name?.trim();
      const refresh_token =
        getRefreshTokenFromRequest(req, expectedApp) ?? req.body.refresh_token?.trim();
      if (!refresh_token) {
        if (expectedApp) clearRefreshTokenCookie(res, expectedApp);
        res.json({ data: { revoked: false } });
        return;
      }
      const data = await authService.logout({ refresh_token });
      const appForCookie = expectedApp ?? data.app_name;
      if (appForCookie) clearRefreshTokenCookie(res, appForCookie);
      res.json({ data: { revoked: data.revoked } });
    } catch (err) {
      next(err);
    }
  },
};
