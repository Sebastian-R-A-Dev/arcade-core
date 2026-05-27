import { prisma } from '../../shared/database/prisma.js';

export const levelMessagesRepository = {
  async findByMilestoneLevel(level: number) {
    return prisma.levelMilestoneMessage.findUnique({ where: { level } });
  },

  async findMany() {
    return prisma.levelMilestoneMessage.findMany({ orderBy: { level: 'asc' } });
  },

  async upsert(level: number, message: string) {
    return prisma.levelMilestoneMessage.upsert({
      where: { level },
      create: { level, message },
      update: { message },
    });
  },

  async deleteByLevel(level: number) {
    return prisma.levelMilestoneMessage.delete({ where: { level } });
  },
};
