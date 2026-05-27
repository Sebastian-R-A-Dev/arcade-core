import { z } from 'zod';

const difficultyName = z.string().trim().min(1).max(64);

export const createDifficultySchema = z.object({
  app_id: z.coerce.number().int().positive(),
  name: difficultyName,
  is_active: z.boolean().optional(),
});

export const updateDifficultyBodySchema = z.object({
  name: difficultyName,
  is_active: z.boolean(),
});

export const adminListDifficultiesQuerySchema = z.object({
  app_id: z.coerce.number().int().positive(),
  include_inactive: z.enum(['true', 'false']).optional(),
});

export const adminDifficultyIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateDifficultyBody = z.infer<typeof createDifficultySchema>;
export type UpdateDifficultyBody = z.infer<typeof updateDifficultyBodySchema>;
export type AdminListDifficultiesQuery = z.infer<typeof adminListDifficultiesQuerySchema>;
