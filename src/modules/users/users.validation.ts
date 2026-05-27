import { z } from 'zod';
import { adminNicknameField, playerNicknameSchema } from './nickname.validation.js';

export const createUserSchema = z.object({
  app_id: z.coerce.number().int().positive(),
  email: z.string().email(),
  password: z.string().min(8),
  nickname: playerNicknameSchema,
});

export type CreateUserBody = z.infer<typeof createUserSchema>;

export const adminCreateUserSchema = z.object({
  app_id: z.coerce.number().int().positive(),
  email: z.string().email(),
  nickname: adminNicknameField,
  role_id: z.coerce.number().int().positive(),
  is_active: z.boolean().optional(),
  avatar_image_id: z.coerce.number().int().positive().optional(),
});

export type AdminCreateUserBody = z.infer<typeof adminCreateUserSchema>;

export const adminUpdateUserSchema = z.object({
  email: z.string().email().optional(),
  app_id: z.coerce.number().int().positive().optional(),
  nickname: adminNicknameField.optional(),
  role_id: z.coerce.number().int().positive().optional(),
  is_active: z.boolean().optional(),
  avatar_image_id: z.union([z.coerce.number().int().positive(), z.null()]).optional(),
  /** Si se envía, reemplaza la contraseña (bcrypt). No fuerza cambio en el próximo login. */
  password: z.string().min(8).max(128).optional(),
});

export type AdminUpdateUserBody = z.infer<typeof adminUpdateUserSchema>;

export const adminUserIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type AdminUserIdParams = z.infer<typeof adminUserIdParamsSchema>;

function singleQueryParam(val: unknown): string | undefined {
  if (typeof val === 'string') return val;
  if (Array.isArray(val) && typeof val[0] === 'string') return val[0];
  return undefined;
}

export const meQuerySchema = z.object({
  expected_app_name: z.preprocess(
    singleQueryParam,
    z.string().trim().min(1).max(128).optional(),
  ),
});

export type MeQuery = z.infer<typeof meQuerySchema>;
