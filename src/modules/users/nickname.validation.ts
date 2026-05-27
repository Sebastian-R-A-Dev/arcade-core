import { z } from 'zod';
import { getPlayerNicknameError } from '../../shared/validation/player-nickname.js';

function playerNicknameField() {
  return z
    .string()
    .trim()
    .min(1)
    .max(64)
    .superRefine((val, ctx) => {
      const message = getPlayerNicknameError(val);
      if (message) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message });
      }
    });
}

/** Nickname libre para operaciones de administrador (permite [GM], signos, etc.). */
export const adminNicknameField = z.string().trim().min(1).max(64);

export const playerNicknameSchema = playerNicknameField();

export type PlayerNickname = z.infer<typeof playerNicknameSchema>;
