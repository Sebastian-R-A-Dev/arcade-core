import type { Score } from '@prisma/client';
import { HttpError } from '../../shared/constants/httpError.js';
import { AppError } from '../../shared/utils/AppError.js';
import { appsRepository } from '../apps/apps.repository.js';
import { usersRepository } from '../users/users.repository.js';
import type { ScoreDto } from './scores.types.js';
import { scoresRepository } from './scores.repository.js';

function toDto(row: Score): ScoreDto {
  return {
    id: row.id,
    user_id: row.userId,
    app_id: row.appId,
    score: row.score,
    max_score: row.maxScore,
    created_at: row.createdAt.toISOString(),
  };
}

export type RecordScoreInput = {
  userId: number;
  tokenAppId: number;
  app_id: number;
  score: number;
};

export const scoresService = {
  async recordScore({
    userId,
    tokenAppId,
    app_id,
    score,
  }: RecordScoreInput): Promise<ScoreDto> {
    if (tokenAppId !== app_id) {
      throw new AppError('Token does not match this app', HttpError.FORBIDDEN);
    }

    const user = await usersRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', HttpError.NOT_FOUND);
    }

    if (user.appId !== app_id) {
      throw new AppError('User does not belong to this app', HttpError.FORBIDDEN);
    }

    const app = await appsRepository.findById(app_id);
    if (!app) {
      throw new AppError('App not found', HttpError.NOT_FOUND);
    }

    const previousBest = await scoresRepository.maxScoreForUserApp(userId, app_id);
    const maxScore = Math.max(previousBest, score);

    const row = await scoresRepository.create({
      userId,
      appId: app_id,
      score,
      maxScore,
    });

    return toDto(row);
  },
};
