import { z } from 'zod';

export const challengeAnswerSchema = z.object({
  question_id: z.coerce.number().int().positive(),
  answer: z.string().min(1),
});

export const challengeTimeoutSchema = z.object({
  question_id: z.coerce.number().int().positive(),
});

export const challengeForfeitSchema = z.object({
  reason: z.enum(['tab_hidden', 'user_exit', 'user_confirmed_leave', 'window_blur']).optional(),
});

export type ChallengeAnswerBody = z.infer<typeof challengeAnswerSchema>;
export type ChallengeTimeoutBody = z.infer<typeof challengeTimeoutSchema>;
export type ChallengeForfeitBody = z.infer<typeof challengeForfeitSchema>;
