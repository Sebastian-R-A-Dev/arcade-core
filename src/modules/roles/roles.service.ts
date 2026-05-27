import type { Role } from '@prisma/client';
import { ADMIN_APP_NAME } from '../../shared/constants/adminApp.js';
import { ROLE_SLUG_ADMINISTRATOR, ROLE_SLUG_PLAYER } from '../../shared/constants/defaultRoles.js';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { appsRepository } from '../apps/apps.repository.js';
import { usersRepository } from '../users/users.repository.js';
import type { RoleDto } from './roles.types.js';
import { rolesRepository } from './roles.repository.js';

function toDto(row: Role): RoleDto {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    created_at: row.createdAt.toISOString(),
  };
}

export const rolesService = {
  async list(): Promise<RoleDto[]> {
    const rows = await rolesRepository.findMany();
    return rows.map(toDto);
  },

  async getPlayerRoleId(): Promise<number> {
    const row = await rolesRepository.findBySlug(ROLE_SLUG_PLAYER);
    if (!row) {
      throw new AppError('Player role is not configured', HttpError.SERVICE_UNAVAILABLE);
    }
    return row.id;
  },

  async getAdministratorRoleId(): Promise<number> {
    const row = await rolesRepository.findBySlug(ROLE_SLUG_ADMINISTRATOR);
    if (!row) {
      throw new AppError('Administrator role is not configured', HttpError.SERVICE_UNAVAILABLE);
    }
    return row.id;
  },

  /** Administrator solo en ADMIN_APP; en apps quiz solo Player. */
  async assertRoleAllowedForApp(roleId: number, appId: number): Promise<Role> {
    const role = await rolesRepository.findById(roleId);
    if (!role) {
      throw new AppError('Role not found', HttpError.NOT_FOUND);
    }
    const app = await appsRepository.findById(appId);
    if (!app) {
      throw new AppError('App not found', HttpError.NOT_FOUND);
    }
    if (role.slug === ROLE_SLUG_ADMINISTRATOR && app.name !== ADMIN_APP_NAME) {
      throw new AppError(
        'Administrator role is only allowed for users in ADMIN_APP',
        HttpError.BAD_REQUEST,
      );
    }
    return role;
  },

  async assertUserIsAdministrator(userId: number, appId: number): Promise<void> {
    const adminApp = await appsRepository.findByName(ADMIN_APP_NAME);
    if (!adminApp || appId !== adminApp.id) {
      throw new AppError('Access denied: admin requires ADMIN_APP', HttpError.FORBIDDEN);
    }
    const adminRole = await rolesRepository.findBySlug(ROLE_SLUG_ADMINISTRATOR);
    if (!adminRole) {
      throw new AppError('Administrator role is not configured', HttpError.SERVICE_UNAVAILABLE);
    }
    const user = await usersRepository.findByIdWithRole(userId);
    if (!user || user.roleId !== adminRole.id) {
      throw new AppError('Access denied: administrator role required', HttpError.FORBIDDEN);
    }
  },
};
