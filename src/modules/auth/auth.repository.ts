import { prisma } from '../../shared/database/prisma.js';

export type CreateRefreshTokenInput = {
  userId: number;
  tokenHash: string;
  expiresAt: Date;
};

export const authRepository = {
  async createRefreshToken({ userId, tokenHash, expiresAt }: CreateRefreshTokenInput) {
    return prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });
  },

  async findByTokenHash(tokenHash: string) {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
  },

  async deleteById(id: number) {
    return prisma.refreshToken.delete({ where: { id } });
  },

  async deleteByTokenHash(tokenHash: string): Promise<boolean> {
    try {
      await prisma.refreshToken.delete({ where: { tokenHash } });
      return true;
    } catch {
      return false;
    }
  },
};
