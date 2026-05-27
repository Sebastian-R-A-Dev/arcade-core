import { hashPassword } from '../../shared/security/password.js';
import { ADMIN_APP_NAME } from '../../shared/constants/adminApp.js';
import { ROLE_SLUG_ADMINISTRATOR } from '../../shared/constants/defaultRoles.js';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { getPlayerNicknameError } from '../../shared/validation/player-nickname.js';
import { accountEventsService } from '../account-events/account-events.service.js';
import { accountEventsRepository } from '../account-events/account-events.repository.js';
import { appsRepository } from '../apps/apps.repository.js';
import { rolesService } from '../roles/roles.service.js';
import { generateRandomPassword } from '../../shared/utils/randomPassword.js';
import { normalizeAuthEmail } from '../../shared/utils/normalizeAuthEmail.js';
import { resolveAvatarForCreate, resolveAvatarForAdmin } from './users.avatar.js';
import { rethrowUserWriteError } from './users.errors.js';
import { userProgressService } from '../user-progress/user-progress.service.js';
import type {
  AdminCreateUserResultDto,
  AdminResetPasswordResultDto,
  AdminUserListItemDto,
  UserPublicDto,
} from './users.types.js';
import { toAdminUserListItemDto, toUserPublicDto } from './users.mapper.js';
import { usersRepository } from './users.repository.js';
import type {
  AdminCreateUserBody,
  AdminUpdateUserBody,
  CreateUserBody,
} from './users.validation.js';

async function assertNicknameAvailable(
  appId: number,
  nickname: string,
  excludeUserId?: number,
): Promise<void> {
  const taken = await usersRepository.findProfileByNicknameAndApp(appId, nickname, excludeUserId);
  if (taken) {
    throw new AppError('Nickname already taken in this app', HttpError.CONFLICT);
  }
}

export const usersService = {
  /** Registro público (generic-login): siempre rol Player. */
  async createUser({
    app_id,
    email,
    password,
    nickname,
    avatar_image_id,
  }: CreateUserBody & { avatar_image_id?: number }): Promise<UserPublicDto> {
    const playerRoleId = await rolesService.getPlayerRoleId();
    return this.createUserWithRole({
      app_id,
      email,
      password,
      nickname,
      role_id: playerRoleId,
      avatar_image_id,
    });
  },

  async createUserWithRole({
    app_id,
    email,
    password,
    nickname,
    role_id,
    avatar_image_id,
  }: CreateUserBody & { role_id: number; avatar_image_id?: number }): Promise<UserPublicDto> {
    const normalizedEmail = normalizeAuthEmail(email);
    const app = await appsRepository.findById(app_id);
    if (!app) {
      throw new AppError('App not found', HttpError.NOT_FOUND);
    }
    if (!app.isActive) {
      throw new AppError('App is not active', HttpError.BAD_REQUEST);
    }

    await rolesService.assertRoleAllowedForApp(role_id, app_id);

    const existing = await usersRepository.findByEmailAndApp(normalizedEmail, app_id);
    if (existing) {
      throw new AppError('Email already registered for this app', HttpError.CONFLICT);
    }

    await assertNicknameAvailable(app_id, nickname);

    const nicknameError = getPlayerNicknameError(nickname);
    if (nicknameError) {
      throw new AppError(nicknameError, HttpError.BAD_REQUEST);
    }

    const avatar = await resolveAvatarForCreate(avatar_image_id);
    const passwordHash = await hashPassword(password);
    try {
      const user = await usersRepository.createWithProfile({
        appId: app_id,
        roleId: role_id,
        email: normalizedEmail,
        passwordHash,
        nickname,
        isActive: true,
        avatarImageId: avatar.avatarImageId,
        avatarUrl: avatar.avatarUrl,
      });

      return toUserPublicDto(user);
    } catch (err: unknown) {
      rethrowUserWriteError(err);
    }
  },

  async createForAdmin(
    payload: AdminCreateUserBody,
    initiatedById: number,
  ): Promise<AdminCreateUserResultDto> {
    await rolesService.assertRoleAllowedForApp(payload.role_id, payload.app_id);

    const existing = await usersRepository.findByEmailAndApp(
      normalizeAuthEmail(payload.email),
      payload.app_id,
    );
    if (existing) {
      throw new AppError('Email already registered for this app', HttpError.CONFLICT);
    }

    await assertNicknameAvailable(payload.app_id, payload.nickname);

    const temporary_password = generateRandomPassword(10);
    const passwordHash = await hashPassword(temporary_password);
    const avatar = await resolveAvatarForCreate(payload.avatar_image_id);

    let user;
    try {
      user = await usersRepository.createWithProfile({
        appId: payload.app_id,
        roleId: payload.role_id,
        email: normalizeAuthEmail(payload.email),
        passwordHash,
        nickname: payload.nickname,
        isActive: payload.is_active ?? true,
        avatarImageId: avatar.avatarImageId,
        avatarUrl: avatar.avatarUrl,
      });
    } catch (err: unknown) {
      rethrowUserWriteError(err);
    }

    await accountEventsService.markPasswordChangeRequired({
      targetUserId: user.id,
      initiatedById,
    });

    return {
      ...toAdminUserListItemDto(user),
      temporary_password,
    };
  },

  async updateForAdmin(userId: number, payload: AdminUpdateUserBody): Promise<AdminUserListItemDto> {
    const existing = await usersRepository.findByIdWithRole(userId);
    if (!existing) {
      throw new AppError('User not found', HttpError.NOT_FOUND);
    }

    const nextAppId = payload.app_id ?? existing.appId;
    const nextRoleId = payload.role_id ?? existing.roleId;
    await rolesService.assertRoleAllowedForApp(nextRoleId, nextAppId);

    if (payload.email) {
      const normalizedEmail = normalizeAuthEmail(payload.email);
      if (normalizedEmail !== existing.email) {
        const dup = await usersRepository.findByEmailAndApp(normalizedEmail, nextAppId);
        if (dup && dup.id !== userId) {
          throw new AppError('Email already registered for this app', HttpError.CONFLICT);
        }
      }
    }

    const nextNickname = payload.nickname ?? existing.profile?.nickname;
    if (nextNickname) {
      await assertNicknameAvailable(nextAppId, nextNickname, userId);
    }

    const avatarUpdate = await resolveAvatarForAdmin(payload.avatar_image_id);

    if (payload.password !== undefined) {
      const passwordHash = await hashPassword(payload.password);
      await accountEventsRepository.applyAdminManualPassword({
        targetUserId: userId,
        passwordHash,
      });
    }

    try {
      const updated = await usersRepository.updateById(userId, {
        email: payload.email !== undefined ? normalizeAuthEmail(payload.email) : undefined,
        appId: payload.app_id,
        roleId: payload.role_id,
        nickname: payload.nickname,
        isActive: payload.is_active,
        ...(avatarUpdate
          ? {
              avatarImageId: avatarUpdate.avatarImageId,
              avatarUrl: avatarUpdate.avatarUrl,
            }
          : {}),
      });
      return toAdminUserListItemDto(updated);
    } catch (err: unknown) {
      rethrowUserWriteError(err);
    }
  },

  async deleteForAdmin(userId: number): Promise<void> {
    const existing = await usersRepository.findById(userId);
    if (!existing) {
      throw new AppError('User not found', HttpError.NOT_FOUND);
    }
    await usersRepository.deleteById(userId);
  },

  async resetPasswordForAdmin(
    userId: number,
    initiatedById: number,
  ): Promise<AdminResetPasswordResultDto> {
    const existing = await usersRepository.findByIdWithRole(userId);
    if (!existing) {
      throw new AppError('User not found', HttpError.NOT_FOUND);
    }
    const result = await accountEventsService.schedulePasswordReset({
      targetUserId: userId,
      initiatedById,
    });
    return {
      user_id: userId,
      email: existing.email,
      app_name: existing.app.name,
      temporary_password: result.temporary_password,
      event_id: result.event_id,
    };
  },

  async listForAdmin(): Promise<AdminUserListItemDto[]> {
    const rows = await usersRepository.findManyForAdminList();
    return rows.map(toAdminUserListItemDto);
  },

  async getMeForToken({
    userId,
    tokenAppId,
    expected_app_name,
  }: {
    userId: number;
    tokenAppId: number;
    expected_app_name?: string | undefined;
  }): Promise<UserPublicDto> {
    const user = await usersRepository.findByIdWithRole(userId);
    if (!user) {
      throw new AppError('User not found', HttpError.NOT_FOUND);
    }
    if (user.appId !== tokenAppId) {
      throw new AppError('Token does not match this user for this app', HttpError.FORBIDDEN);
    }
    usersService.assertUserIsActive(user);
    const expected = expected_app_name?.trim();
    if (expected) {
      const app = await appsRepository.findById(user.appId);
      if (!app || app.name !== expected) {
        throw new AppError('User session is not for this application', HttpError.FORBIDDEN);
      }
    }
    return { ...toUserPublicDto(user), progress: await userProgressService.getForUser(userId) };
  },

  assertUserIsActive(user: { isActive: boolean }): void {
    if (!user.isActive) {
      throw new AppError('Account is inactive', HttpError.FORBIDDEN);
    }
  },

  async assertCanLoginToAdminApp(userId: number, appName: string): Promise<void> {
    if (appName !== ADMIN_APP_NAME) return;
    const user = await usersRepository.findByIdWithRole(userId);
    if (!user || user.role.slug !== ROLE_SLUG_ADMINISTRATOR) {
      throw new AppError(
        'Access denied: only administrators can sign in to the admin application',
        HttpError.FORBIDDEN,
      );
    }
  },
};
