import { z } from 'zod';
import {
  MAX_PLAYER_LEVEL,
  xpRequiredForNextLevel,
} from '../../shared/progression/progression.js';

export const adminSetUserProgressSchema = z
  .object({
    level: z.coerce.number().int().min(0).max(MAX_PLAYER_LEVEL),
    xp: z.coerce.number().int().min(0),
    games_played: z.coerce.number().int().min(0),
    wins: z.coerce.number().int().min(0),
    total_score: z.coerce.number().int().min(0),
  })
  .superRefine((data, ctx) => {
    if (data.level >= MAX_PLAYER_LEVEL) return;
    const cap = xpRequiredForNextLevel(data.level);
    if (data.xp >= cap) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `XP must be less than ${cap} for level ${data.level}`,
        path: ['xp'],
      });
    }
  });

export type AdminSetUserProgressBody = z.infer<typeof adminSetUserProgressSchema>;
