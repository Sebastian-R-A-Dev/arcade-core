import { z } from 'zod';

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z][a-z0-9_]*$/, 'slug must be lowercase snake_case starting with a letter');

export const createQuestionTypeSchema = z.object({
  slug: slugSchema,
  label: z.string().trim().min(1).max(128),
  description: z.string().trim().max(512).optional(),
  sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  is_active: z.boolean().optional(),
});

export const updateQuestionTypeBodySchema = z.object({
  label: z.string().trim().min(1).max(128),
  description: z.string().trim().max(512).nullable().optional(),
  sort_order: z.coerce.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

export const adminListQuestionTypesQuerySchema = z.object({
  include_inactive: z.enum(['true', 'false']).optional(),
});

export const adminQuestionTypeIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateQuestionTypeBody = z.infer<typeof createQuestionTypeSchema>;
export type UpdateQuestionTypeBody = z.infer<typeof updateQuestionTypeBodySchema>;
export type AdminListQuestionTypesQuery = z.infer<typeof adminListQuestionTypesQuerySchema>;
