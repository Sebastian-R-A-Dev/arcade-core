import { z } from 'zod';
import { MAX_PLAYER_LEVEL } from '../../shared/progression/progression.js';

export const resolveLevelMessageQuerySchema = z.object({
  level: z.coerce.number().int().min(0).max(MAX_PLAYER_LEVEL),
});

export type ResolveLevelMessageQuery = z.infer<typeof resolveLevelMessageQuerySchema>;

export const adminLevelMilestoneParamsSchema = z.object({
  level: z.coerce.number().int().min(0).max(MAX_PLAYER_LEVEL),
});

export const adminUpsertLevelMessageSchema = z.object({
  message: z.string().trim().min(1).max(512),
});

export type AdminUpsertLevelMessageBody = z.infer<typeof adminUpsertLevelMessageSchema>;

export const adminCreateLevelMessageSchema = z.object({
  level: z.coerce.number().int().min(0).max(MAX_PLAYER_LEVEL),
  message: z.string().trim().min(1).max(512),
});

export type AdminCreateLevelMessageBody = z.infer<typeof adminCreateLevelMessageSchema>;
