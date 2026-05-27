import { z } from 'zod';

export const createScoreSchema = z.object({
  app_id: z.coerce.number().int().positive(),
  score: z.coerce.number().int().min(0),
});

export type CreateScoreBody = z.infer<typeof createScoreSchema>;
