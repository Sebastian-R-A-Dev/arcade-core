import { AccountEventStatus, AccountEventType, type Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';

export const accountEventsRepository = {
  async createPasswordResetRequired(data: {
    targetUserId: number;
    initiatedById: number | null;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.userAccountEvent.updateMany({
        where: {
          targetUserId: data.targetUserId,
          type: AccountEventType.password_reset_required,
          status: AccountEventStatus.pending,
        },
        data: { status: AccountEventStatus.cancelled },
      });
      return tx.userAccountEvent.create({
        data: {
          type: AccountEventType.password_reset_required,
          status: AccountEventStatus.pending,
          targetUserId: data.targetUserId,
          initiatedById: data.initiatedById,
        },
      });
    });
  },

  /** Guarda hash bcrypt, revoca sesiones y crea evento pendiente en una sola transacción. */
  async applyAdminPasswordReset(data: {
    targetUserId: number;
    initiatedById: number | null;
    passwordHash: string;
  }) {
    return prisma.$transaction(async (tx) => {
      await tx.userAccountEvent.updateMany({
        where: {
          targetUserId: data.targetUserId,
          type: AccountEventType.password_reset_required,
          status: AccountEventStatus.pending,
        },
        data: { status: AccountEventStatus.cancelled },
      });

      await tx.user.update({
        where: { id: data.targetUserId },
        data: { password: data.passwordHash },
      });

      await tx.refreshToken.deleteMany({ where: { userId: data.targetUserId } });

      return tx.userAccountEvent.create({
        data: {
          type: AccountEventType.password_reset_required,
          status: AccountEventStatus.pending,
          targetUserId: data.targetUserId,
          initiatedById: data.initiatedById,
        },
      });
    });
  },

  /** Admin sets password directly — no forced change on next login. */
  async applyAdminManualPassword(data: {
    targetUserId: number;
    passwordHash: string;
  }): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.userAccountEvent.updateMany({
        where: {
          targetUserId: data.targetUserId,
          type: AccountEventType.password_reset_required,
          status: AccountEventStatus.pending,
        },
        data: { status: AccountEventStatus.cancelled },
      });

      await tx.user.update({
        where: { id: data.targetUserId },
        data: { password: data.passwordHash },
      });

      await tx.refreshToken.deleteMany({ where: { userId: data.targetUserId } });
    });
  },

  async findPendingPasswordResetForUser(targetUserId: number) {
    return prisma.userAccountEvent.findFirst({
      where: {
        targetUserId,
        type: AccountEventType.password_reset_required,
        status: AccountEventStatus.pending,
      },
      orderBy: { id: 'desc' },
    });
  },

  async findById(id: number) {
    return prisma.userAccountEvent.findUnique({ where: { id } });
  },

  async complete(id: number) {
    return prisma.userAccountEvent.update({
      where: { id },
      data: {
        status: AccountEventStatus.completed,
        completedAt: new Date(),
      },
    });
  },

  async findManyForAdmin(where?: Prisma.UserAccountEventWhereInput) {
    return prisma.userAccountEvent.findMany({
      where,
      include: {
        targetUser: {
          include: {
            profile: true,
            app: { select: { name: true } },
          },
        },
        initiatedBy: {
          include: {
            profile: true,
            app: { select: { name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  },
};
