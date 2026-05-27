import { prisma } from '../../shared/database/prisma.js';

export const scoresRepository = {
  async create({
    userId,
    appId,
    score,
    maxScore,
  }: {
    userId: number;
    appId: number;
    score: number;
    maxScore: number;
  }) {
    return prisma.score.create({
      data: { userId, appId, score, maxScore },
    });
  },

  async maxScoreForUserApp(userId: number, appId: number): Promise<number> {
    const agg = await prisma.score.aggregate({
      where: { userId, appId },
      _max: { maxScore: true },
    });
    return agg._max.maxScore ?? 0;
  },
};
