import { z } from 'zod';

export const leaderboardQuerySchema = z.object({
  app_name: z.string().trim().min(1).max(128),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
