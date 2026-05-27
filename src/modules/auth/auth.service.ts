import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { verifyPassword } from '../../shared/security/password.js';
import { normalizeAuthEmail } from '../../shared/utils/normalizeAuthEmail.js';
import { accountEventsService } from '../account-events/account-events.service.js';
import { appsRepository } from '../apps/apps.repository.js';
import { toUserPublicDto } from '../users/users.mapper.js';
import { usersRepository } from '../users/users.repository.js';
import { usersService } from '../users/users.service.js';
import type {
  AuthLoginResult,
  AuthLogoutResult,
  AuthRefreshResult,
  AuthRegisterResult,
} from './auth.types.js';
import { authRepository } from './auth.repository.js';
import { tokenIssuer } from './tokens/tokenIssuer.service.js';
import type { CompletePasswordChangeBody, LoginBody, RegisterBody } from './auth.validation.js';

export const authService = {
  async register({
    app_name,
    email,
    password,
    nickname,
    avatar_image_id,
  }: RegisterBody): Promise<AuthRegisterResult> {
    const nameKey = app_name.trim();
    if (nameKey === 'ADMIN_APP') {
      throw new AppError('Registration is not allowed for this application', HttpError.FORBIDDEN);
    }

    const app = await appsRepository.findByName(nameKey);
    if (!app) {
      throw new AppError('App not found', HttpError.NOT_FOUND);
    }

    const user = await usersService.createUser({
      app_id: app.id,
      email: normalizeAuthEmail(email),
      password,
      nickname,
      avatar_image_id,
    });

    const tokens = await tokenIssuer.issueTokenPair(user.id, user.email, user.app_id, app.name);
    const pending = await accountEventsService.findPendingPasswordChangeForUser(user.id);
    return {
      user,
      redirect_url: app.url,
      pending_password_change: pending,
      ...tokens,
    };
  },

  async login({ app_name, email, password }: LoginBody): Promise<AuthLoginResult> {
    const app = await appsRepository.findByName(app_name.trim());
    if (!app) {
      throw new AppError('App not found', HttpError.NOT_FOUND);
    }

    const user = await usersRepository.findByEmailAndApp(normalizeAuthEmail(email), app.id);
    if (!user) {
      throw new AppError('Invalid credentials', HttpError.UNAUTHORIZED);
    }

    const ok = await verifyPassword(password, user.password);
    if (!ok) {
      throw new AppError('Invalid credentials', HttpError.UNAUTHORIZED);
    }

    usersService.assertUserIsActive(user);
    await usersService.assertCanLoginToAdminApp(user.id, app.name);

    const tokens = await tokenIssuer.issueTokenPair(user.id, user.email, user.appId, app.name);
    const pending = await accountEventsService.findPendingPasswordChangeForUser(user.id);
    return {
      user: toUserPublicDto(user),
      redirect_url: app.url,
      pending_password_change: pending,
      ...tokens,
    };
  },

  async completePasswordChange(
    userId: number,
    body: CompletePasswordChangeBody,
  ): Promise<AuthRefreshResult & { completed: true }> {
    await accountEventsService.completePasswordChange({
      userId,
      eventId: body.event_id,
      newPassword: body.new_password,
    });

    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', HttpError.NOT_FOUND);
    }
    const app = await appsRepository.findById(user.appId);
    if (!app) {
      throw new AppError('App not found', HttpError.NOT_FOUND);
    }

    const tokens = await tokenIssuer.issueTokenPair(user.id, user.email, user.appId, app.name);
    return { completed: true, ...tokens, app_name: app.name };
  },

  async refresh(payload: {
    refresh_token: string;
    expected_app_name?: string | undefined;
  }): Promise<AuthRefreshResult> {
    const tokenHash = tokenIssuer.hashRefreshToken(payload.refresh_token);
    const row = await authRepository.findByTokenHash(tokenHash);
    if (!row || row.expiresAt < new Date()) {
      if (row) {
        await authRepository.deleteById(row.id).catch(() => {});
      }
      throw new AppError('Invalid or expired refresh token', HttpError.UNAUTHORIZED);
    }

    const user = await usersRepository.findById(row.userId);
    if (!user) {
      await authRepository.deleteById(row.id).catch(() => {});
      throw new AppError('Invalid or expired refresh token', HttpError.UNAUTHORIZED);
    }

    try {
      usersService.assertUserIsActive(user);
    } catch (err) {
      await authRepository.deleteById(row.id).catch(() => {});
      throw err;
    }

    const app = await appsRepository.findById(user.appId);
    if (!app) {
      await authRepository.deleteById(row.id).catch(() => {});
      throw new AppError('App not found', HttpError.NOT_FOUND);
    }

    const expected = payload.expected_app_name?.trim();
    if (expected && app.name !== expected) {
      throw new AppError('Refresh session is not for this application', HttpError.FORBIDDEN);
    }

    await authRepository.deleteById(row.id);
    const tokens = await tokenIssuer.issueTokenPair(user.id, user.email, user.appId, app.name);
    return { ...tokens, app_name: app.name };
  },

  async logout(payload: { refresh_token: string }): Promise<AuthLogoutResult> {
    const tokenHash = tokenIssuer.hashRefreshToken(payload.refresh_token);
    const row = await authRepository.findByTokenHash(tokenHash);
    let app_name: string | undefined;
    if (row) {
      const user = await usersRepository.findById(row.userId);
      const app = user ? await appsRepository.findById(user.appId) : null;
      app_name = app?.name;
    }
    await authRepository.deleteByTokenHash(tokenHash);
    return { revoked: Boolean(row), app_name };
  },
};
