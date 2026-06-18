import type { UserProgress } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';
import {
  MAX_PLAYER_LEVEL,
  WIN_BONUS_XP,
  applyXpGain,
  leaderboardScoreForSession,
  xpRequiredForNextLevel,
} from '../../shared/progression/progression.js';

export const userProgressRepository = {
  async findByUserId(userId: number) {
    return prisma.userProgress.findUnique({ where: { userId } });
  },

  async ensureForUser(userId: number) {
    return prisma.userProgress.upsert({
      where: { userId },
      create: { userId, level: 0, xp: 0, gamesPlayed: 0, wins: 0, totalScore: 0, bonusXpTotal: 0 },
      update: {},
    });
  },

  async createForUser(userId: number) {
    return prisma.userProgress.create({
      data: { userId, level: 0, xp: 0, gamesPlayed: 0, wins: 0, totalScore: 0, bonusXpTotal: 0 },
    });
  },

  async applyChallengeEnd(
    userId: number,
    input: {
      completed: boolean;
      correctCount: number;
      totalQuestions: number;
      sessionXp: number;
    },
  ) {
    await this.ensureForUser(userId);
    const sessionScore = leaderboardScoreForSession(
      input.correctCount,
      input.totalQuestions,
      input.completed,
    );

    if (!input.completed) {
      return prisma.userProgress.update({
        where: { userId },
        data: {
          gamesPlayed: { increment: 1 },
          totalScore: { increment: sessionScore },
        },
      });
    }

    const row = await prisma.userProgress.findUniqueOrThrow({ where: { userId } });
    const xpGain = input.sessionXp + WIN_BONUS_XP;
    const next = applyXpGain(row.level, row.xp, xpGain);
    return prisma.userProgress.update({
      where: { userId },
      data: {
        level: next.level,
        xp: next.xp,
        gamesPlayed: { increment: 1 },
        wins: { increment: 1 },
        totalScore: { increment: sessionScore },
        bonusXpTotal: { increment: WIN_BONUS_XP },
      },
    });
  },

  async findTopForLeaderboard(appName: string, limit: number) {
    return prisma.userProgress.findMany({
      where: {
        user: {
          isActive: true,
          role: { slug: 'player' },
          app: { name: appName },
          profile: { isNot: null },
        },
      },
      include: {
        user: { include: { profile: true } },
      },
      orderBy: [{ wins: 'desc' }, { totalScore: 'desc' }],
      take: limit,
    });
  },

  async applyXpGainOnly(userId: number, xpGain: number) {
    await this.ensureForUser(userId);
    const row = await prisma.userProgress.findUniqueOrThrow({ where: { userId } });
    const next = applyXpGain(row.level, row.xp, xpGain);
    return prisma.userProgress.update({
      where: { userId },
      data: { level: next.level, xp: next.xp },
    });
  },

  async updateByAdmin(
    userId: number,
    data: {
      level: number;
      xp: number;
      gamesPlayed: number;
      wins: number;
      totalScore: number;
    },
  ) {
    await this.ensureForUser(userId);
    let level = Math.min(Math.max(data.level, 0), MAX_PLAYER_LEVEL);
    let xp = Math.max(0, data.xp);
    if (level >= MAX_PLAYER_LEVEL) {
      level = MAX_PLAYER_LEVEL;
      xp = 0;
    } else {
      const cap = xpRequiredForNextLevel(level);
      xp = Math.min(xp, Math.max(0, cap - 1));
    }
    return prisma.userProgress.update({
      where: { userId },
      data: {
        level,
        xp,
        gamesPlayed: Math.max(0, data.gamesPlayed),
        wins: Math.max(0, data.wins),
        totalScore: Math.max(0, data.totalScore),
      },
    });
  },

  async findManyForAdmin() {
    return prisma.userProgress.findMany({
      where: {
        user: { role: { slug: 'player' } },
      },
      include: {
        user: {
          include: {
            profile: true,
            app: { select: { name: true } },
            role: true,
          },
        },
      },
      orderBy: { userId: 'asc' },
    });
  },
};

export type { UserProgress };
