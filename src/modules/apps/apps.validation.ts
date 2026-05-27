import { z } from 'zod';
import { parseAbsoluteHttpUrl } from './apps.url.js';

const appHttpUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .superRefine((val, ctx) => {
    try {
      parseAbsoluteHttpUrl(val);
    } catch (e) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: e instanceof Error ? e.message : 'Invalid app URL',
      });
    }
  });

export const createAppSchema = z.object({
  name: z.string().trim().min(1).max(128),
  url: appHttpUrlSchema,
  type: z.enum(['quiz', 'administration']),
  is_active: z.boolean().optional(),
});

/** PATCH /admin/apps/:id */
export const updateAppBodySchema = z.object({
  name: z.string().trim().min(1).max(128),
  url: appHttpUrlSchema,
  type: z.enum(['quiz', 'administration']),
  is_active: z.boolean().optional(),
});

export const adminAppIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type CreateAppBody = z.infer<typeof createAppSchema>;
export type UpdateAppBody = z.infer<typeof updateAppBodySchema>;
