import { prisma } from '../../shared/database/prisma.js';
import type { GameSessionStatus } from '@prisma/client';

export const challengeRepository = {
  async countQuestionsForApp(appId: number): Promise<number> {
    return prisma.question.count({ where: { appId } });
  },

  async cancelActiveSessions(userId: number, appId: number): Promise<void> {
    await prisma.gameSession.updateMany({
      where: { userId, appId, status: 'active' },
      data: { status: 'failed', endedAt: new Date() },
    });
  },

  async createSession(userId: number, appId: number, totalQuestions: number) {
    return prisma.gameSession.create({
      data: {
        userId,
        appId,
        totalQuestions,
        status: 'active',
      },
    });
  },

  async findSessionById(sessionId: number) {
    return prisma.gameSession.findUnique({ where: { id: sessionId } });
  },

  async countAttemptsForQuestion(sessionId: number, questionId: number): Promise<number> {
    return prisma.challengeAnswerAttempt.count({
      where: { sessionId, questionId },
    });
  },

  async hasCorrectAttempt(sessionId: number, questionId: number): Promise<boolean> {
    const row = await prisma.challengeAnswerAttempt.findFirst({
      where: { sessionId, questionId, isCorrect: true },
    });
    return row != null;
  },

  async recordAttempt(sessionId: number, questionId: number, isCorrect: boolean) {
    return prisma.challengeAnswerAttempt.create({
      data: { sessionId, questionId, isCorrect },
    });
  },

  async incrementCorrectCount(sessionId: number) {
    return prisma.gameSession.update({
      where: { id: sessionId },
      data: { correctCount: { increment: 1 } },
    });
  },

  async endSession(sessionId: number, status: GameSessionStatus, xpEarned: number) {
    return prisma.gameSession.update({
      where: { id: sessionId },
      data: {
        status,
        xpEarned,
        endedAt: new Date(),
      },
    });
  },

  async getIssuedQuestionIds(sessionId: number): Promise<number[]> {
    const rows = await prisma.challengeQuestionIssue.findMany({
      where: { sessionId },
      select: { questionId: true },
    });
    return rows.map((r) => r.questionId);
  },

  async findUnansweredIssue(sessionId: number) {
    return prisma.challengeQuestionIssue.findFirst({
      where: { sessionId, answeredAt: null },
      orderBy: { issuedAt: 'desc' },
    });
  },

  async findIssue(sessionId: number, questionId: number) {
    return prisma.challengeQuestionIssue.findUnique({
      where: { sessionId_questionId: { sessionId, questionId } },
    });
  },

  async createIssue(input: {
    sessionId: number;
    questionId: number;
    difficultyId: number;
    expiresAt: Date;
  }) {
    return prisma.challengeQuestionIssue.create({ data: input });
  },

  async markIssueAnswered(sessionId: number, questionId: number) {
    return prisma.challengeQuestionIssue.update({
      where: { sessionId_questionId: { sessionId, questionId } },
      data: { answeredAt: new Date() },
    });
  },

  async findActiveDifficultiesWithQuestions(appId: number, excludeQuestionIds: number[]) {
    return prisma.difficulty.findMany({
      where: {
        appId,
        isActive: true,
        questions: {
          some: {
            id: excludeQuestionIds.length ? { notIn: excludeQuestionIds } : undefined,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  },

  async findRandomQuestionForDifficulty(
    appId: number,
    difficultyId: number,
    excludeQuestionIds: number[],
  ) {
    const rows = await prisma.question.findMany({
      where: {
        appId,
        difficultyId,
        ...(excludeQuestionIds.length ? { id: { notIn: excludeQuestionIds } } : {}),
      },
      select: { id: true },
    });
    if (rows.length === 0) return null;
    const pick = rows[Math.floor(Math.random() * rows.length)]!;
    return prisma.question.findUnique({
      where: { id: pick.id },
      include: { difficulty: true, questionType: true },
    });
  },
};
