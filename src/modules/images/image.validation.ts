import { z } from 'zod';
import { IMAGE_KINDS } from '../../shared/constants/imageKinds.js';

function emptyMultipartField(val: unknown): unknown {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'string') {
    const t = val.trim();
    return t === '' ? undefined : t;
  }
  return undefined;
}

export const uploadImageBodySchema = z
  .object({
    image_name: z.preprocess(
      emptyMultipartField,
      z.string().trim().min(1).max(256).optional(),
    ),
    name: z.preprocess(emptyMultipartField, z.string().trim().min(1).max(256).optional()),
    kind: z.preprocess(
      emptyMultipartField,
      z.enum(IMAGE_KINDS).optional(),
    ),
  })
  .transform((data) => ({
    labelFromBody: data.image_name ?? data.name,
    kind: data.kind ?? 'generic',
  }));

export const deleteImageBodySchema = z.object({
  path: z
    .string()
    .trim()
    .min(1)
    .refine(
      (p) => p.startsWith('questions/') || p.startsWith('library/'),
      'path must start with questions/ or library/',
    )
    .refine((p) => !p.includes('..'), 'path cannot contain ..'),
});

export type UploadImageParsedBody = z.infer<typeof uploadImageBodySchema>;
export type DeleteImageBody = z.infer<typeof deleteImageBodySchema>;

export const adminListImagesQuerySchema = z.object({
  q: z.string().trim().max(256).optional(),
  kind: z.enum(IMAGE_KINDS).optional(),
});

export const adminDeleteImageParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type AdminListImagesQuery = z.infer<typeof adminListImagesQuerySchema>;
export type AdminDeleteImageParams = z.infer<typeof adminDeleteImageParamsSchema>;

export const publicListAvatarsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export type PublicListAvatarsQuery = z.infer<typeof publicListAvatarsQuerySchema>;
