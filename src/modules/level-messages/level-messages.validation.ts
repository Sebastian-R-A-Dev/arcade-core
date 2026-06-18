import { z } from 'zod';
import { MAX_PLAYER_LEVEL } from '../../shared/progression/progression.js';

export const resolveLevelMessageQuerySchema = z.object({
  level: z.coerce.number().int().min(0).max(MAX_PLAYER_LEVEL),
  app_name: z.string().trim().min(1).max(128),
});

export type ResolveLevelMessageQuery = z.infer<typeof resolveLevelMessageQuerySchema>;

export const adminListLevelMessagesQuerySchema = z.object({
  app_id: z.coerce.number().int().positive(),
});

export type AdminListLevelMessagesQuery = z.infer<typeof adminListLevelMessagesQuerySchema>;

export const adminLevelMilestoneParamsSchema = z.object({
  level: z.coerce.number().int().min(0).max(MAX_PLAYER_LEVEL),
});

export const adminLevelMessageMutationQuerySchema = z.object({
  app_id: z.coerce.number().int().positive(),
});

export type AdminLevelMessageMutationQuery = z.infer<
  typeof adminLevelMessageMutationQuerySchema
>;

export const adminUpsertLevelMessageSchema = z.object({
  message: z.string().trim().min(1).max(512),
});

export type AdminUpsertLevelMessageBody = z.infer<typeof adminUpsertLevelMessageSchema>;

export const adminCreateLevelMessageSchema = z.object({
  app_id: z.coerce.number().int().positive(),
  level: z.coerce.number().int().min(0).max(MAX_PLAYER_LEVEL),
  message: z.string().trim().min(1).max(512),
});

export type AdminCreateLevelMessageBody = z.infer<typeof adminCreateLevelMessageSchema>;
