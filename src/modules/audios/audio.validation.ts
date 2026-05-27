import { z } from 'zod';

function emptyMultipartField(val: unknown): unknown {
  if (val === '' || val === null || val === undefined) return undefined;
  if (typeof val === 'string') {
    const t = val.trim();
    return t === '' ? undefined : t;
  }
  return undefined;
}

export const uploadAudioBodySchema = z
  .object({
    audio_name: z.preprocess(
      emptyMultipartField,
      z.string().trim().min(1).max(256).optional(),
    ),
    name: z.preprocess(emptyMultipartField, z.string().trim().min(1).max(256).optional()),
  })
  .transform((data) => ({
    labelFromBody: data.audio_name ?? data.name,
  }));

export type UploadAudioParsedBody = z.infer<typeof uploadAudioBodySchema>;

export const listAudiosQuerySchema = z.object({
  q: z.string().trim().max(256).optional(),
});

export type ListAudiosQuery = z.infer<typeof listAudiosQuerySchema>;
