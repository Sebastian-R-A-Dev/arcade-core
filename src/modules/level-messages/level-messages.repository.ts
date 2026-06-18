import { prisma } from '../../shared/database/prisma.js';

export const levelMessagesRepository = {
  async findByAppAndMilestoneLevel(appId: number, level: number) {
    return prisma.levelMilestoneMessage.findUnique({
      where: { appId_level: { appId, level } },
    });
  },

  async findManyByApp(appId: number) {
    return prisma.levelMilestoneMessage.findMany({
      where: { appId },
      orderBy: { level: 'asc' },
    });
  },

  async upsert(appId: number, level: number, message: string) {
    return prisma.levelMilestoneMessage.upsert({
      where: { appId_level: { appId, level } },
      create: { appId, level, message },
      update: { message },
    });
  },

  async deleteByAppAndLevel(appId: number, level: number) {
    return prisma.levelMilestoneMessage.delete({
      where: { appId_level: { appId, level } },
    });
  },
};
