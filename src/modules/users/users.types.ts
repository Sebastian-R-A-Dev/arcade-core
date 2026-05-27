import type { UserProgressDto } from '../user-progress/user-progress.service.js';

export type UserRoleSnippetDto = {
  id: number;
  slug: string;
  label: string;
};

export type UserProfileSnippetDto = {
  id: number;
  nickname: string;
  avatar_url: string | null;
};

/** Public user shape returned by API (no secrets). */
export type UserPublicDto = {
  id: number;
  app_id: number;
  email: string;
  is_active: boolean;
  role: UserRoleSnippetDto;
  created_at: string;
  profile: UserProfileSnippetDto | null;
  progress?: UserProgressDto;
};

/** Admin GET /admin/users — fila con app y perfil (sin contraseña). */
export type AdminUserListItemDto = {
  id: number;
  email: string;
  app_id: number;
  app_name: string;
  role_id: number;
  role_slug: string;
  role_label: string;
  nickname: string | null;
  avatar_url: string | null;
  avatar_image_id: number | null;
  is_active: boolean;
  created_at: string;
};

export type AdminCreateUserResultDto = AdminUserListItemDto & {
  temporary_password: string;
};

export type AdminResetPasswordResultDto = {
  user_id: number;
  email: string;
  app_name: string;
  temporary_password: string;
  event_id: number;
};
