import type { Role, User, UserProfile } from '@prisma/client';
import type {
  AdminUserListItemDto,
  UserPublicDto,
  UserRoleSnippetDto,
} from './users.types.js';

type ProfileWithAvatar = UserProfile & {
  avatarImage?: { publicUrl: string } | null;
};

function resolveAvatarUrl(profile: ProfileWithAvatar | null | undefined): string | null {
  if (!profile) return null;
  if (profile.avatarImage?.publicUrl) return profile.avatarImage.publicUrl;
  return profile.avatarUrl ?? null;
}

type UserToPublicSource = Pick<User, 'id' | 'appId' | 'email' | 'isActive' | 'createdAt'> & {
  profile?: ProfileWithAvatar | null;
  role: Pick<Role, 'id' | 'slug' | 'label'>;
};

function toRoleSnippet(role: Pick<Role, 'id' | 'slug' | 'label'>): UserRoleSnippetDto {
  return { id: role.id, slug: role.slug, label: role.label };
}

/** Map persisted user (+ optional profile) to API DTO. */
export function toUserPublicDto(user: UserToPublicSource): UserPublicDto {
  const profile = user.profile;
  return {
    id: user.id,
    app_id: user.appId,
    email: user.email,
    is_active: user.isActive,
    role: toRoleSnippet(user.role),
    created_at: user.createdAt.toISOString(),
    profile: profile
      ? { id: profile.id, nickname: profile.nickname, avatar_url: resolveAvatarUrl(profile) }
      : null,
  };
}

type AdminListSource = User & {
  profile: ProfileWithAvatar | null;
  app: { name: string };
  role: Role;
};

export function toAdminUserListItemDto(row: AdminListSource): AdminUserListItemDto {
  return {
    id: row.id,
    email: row.email,
    app_id: row.appId,
    app_name: row.app.name,
    role_id: row.roleId,
    role_slug: row.role.slug,
    role_label: row.role.label,
    nickname: row.profile?.nickname ?? null,
    avatar_url: resolveAvatarUrl(row.profile),
    avatar_image_id: row.profile?.avatarImageId ?? null,
    is_active: row.isActive,
    created_at: row.createdAt.toISOString(),
  };
}
