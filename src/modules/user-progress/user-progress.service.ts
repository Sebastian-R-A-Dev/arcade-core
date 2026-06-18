import { prisma } from '../../shared/database/prisma.js';
import {
  levelToTierLabel,
  toProgressSnapshot,
  type ProgressSnapshot,
} from '../../shared/progression/progression.js';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { levelMessagesService } from '../level-messages/level-messages.service.js';
import { userProgressRepository } from './user-progress.repository.js';
import type { AdminSetUserProgressBody } from './user-progress.validation.js';

export type UserProgressDto = ProgressSnapshot & {
  user_id: number;
  games_played: number;
  wins: number;
  total_score: number;
  bonus_xp_total: number;
  tier_label: string;
  level_message: string;
};

async function toDto(
  row: {
    userId: number;
    level: number;
    xp: number;
    gamesPlayed: number;
    wins: number;
    totalScore: number;
    bonusXpTotal: number;
  },
  appId: number,
): Promise<UserProgressDto> {
  const snap = toProgressSnapshot(row.level, row.xp);
  const level_message = await levelMessagesService.resolveForPlayerLevel(row.level, appId);
  return {
    user_id: row.userId,
    games_played: row.gamesPlayed,
    wins: row.wins,
    total_score: row.totalScore,
    bonus_xp_total: row.bonusXpTotal,
    tier_label: levelToTierLabel(row.level),
    level_message,
    ...snap,
  };
}

export const userProgressService = {
  async getForUser(userId: number): Promise<UserProgressDto> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { appId: true },
    });
    if (!user) {
      throw new AppError('User not found', HttpError.NOT_FOUND);
    }
    const row = await userProgressRepository.ensureForUser(userId);
    return toDto(row, user.appId);
  },

  async listForAdmin() {
    const rows = await userProgressRepository.findManyForAdmin();
    return Promise.all(
      rows.map(async (row) => ({
        ...(await toDto(row, row.user.appId)),
        email: row.user.email,
        nickname: row.user.profile?.nickname ?? null,
        app_id: row.user.appId,
        app_name: row.user.app.name,
      })),
    );
  },

  async updateForAdmin(userId: number, body: AdminSetUserProgressBody) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', HttpError.NOT_FOUND);
    }
    const row = await userProgressRepository.updateByAdmin(userId, {
      level: body.level,
      xp: body.xp,
      gamesPlayed: body.games_played,
      wins: body.wins,
      totalScore: body.total_score,
    });
    return toDto(row, user.appId);
  },
};
