import { prisma } from '../../shared/database/prisma.js';

export const healthRepository = {
  async pingDatabase(): Promise<void> {
    await prisma.$queryRaw`SELECT 1`;
  },
};
