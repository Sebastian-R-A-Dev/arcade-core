import { z } from 'zod';
import { playerNicknameSchema } from '../users/nickname.validation.js';

/** Registro vía portal (generic-login): por nombre de app, igual que login — no admite ADMIN_APP. */
export const registerSchema = z.object({
  app_name: z.string().trim().min(1).max(128),
  email: z.string().email(),
  password: z.string().min(8),
  nickname: playerNicknameSchema,
  avatar_image_id: z.coerce.number().int().positive().optional(),
});

export type RegisterBody = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  app_name: z.string().trim().min(1).max(128),
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginBody = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refresh_token: z.string().trim().min(1).optional(),
  expected_app_name: z.string().trim().min(1).max(128).optional(),
});

export type RefreshBody = z.infer<typeof refreshSchema>;

export const logoutSchema = z.object({
  refresh_token: z.string().trim().min(1).optional(),
  expected_app_name: z.string().trim().min(1).max(128).optional(),
});

export type LogoutBody = z.infer<typeof logoutSchema>;

export const completePasswordChangeSchema = z.object({
  event_id: z.coerce.number().int().positive(),
  new_password: z.string().min(8),
});

export type CompletePasswordChangeBody = z.infer<typeof completePasswordChangeSchema>;
