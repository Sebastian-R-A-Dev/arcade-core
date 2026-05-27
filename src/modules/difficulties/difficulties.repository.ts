import type { Difficulty } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';

export type CreateDifficultyRowInput = {
  appId: number;
  name: string;
  isActive: boolean;
};

export type UpdateDifficultyRowInput = {
  name: string;
  isActive: boolean;
};

export const difficultiesRepository = {
  async create(data: CreateDifficultyRowInput): Promise<Difficulty> {
    return prisma.difficulty.create({ data });
  },

  async findById(id: number): Promise<Difficulty | null> {
    return prisma.difficulty.findUnique({ where: { id } });
  },

  async findManyByApp(appId: number, includeInactive: boolean): Promise<Difficulty[]> {
    return prisma.difficulty.findMany({
      where: {
        appId,
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ name: 'asc' }],
    });
  },

  async updateById(id: number, data: UpdateDifficultyRowInput): Promise<Difficulty> {
    return prisma.difficulty.update({ where: { id }, data });
  },

  async deleteById(id: number): Promise<void> {
    await prisma.difficulty.delete({ where: { id } });
  },

  async countQuestions(id: number): Promise<number> {
    return prisma.question.count({ where: { difficultyId: id } });
  },
};
