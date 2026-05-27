import { HttpError } from '../../shared/constants/httpError.js';
import { hashPassword } from '../../shared/security/password.js';
import { AppError } from '../../shared/utils/AppError.js';
import { prisma } from '../../shared/database/prisma.js';
import { generateRandomPassword } from '../../shared/utils/randomPassword.js';
import { usersRepository } from '../users/users.repository.js';
import type { AccountEventListItemDto, PendingPasswordChangeDto } from './account-events.types.js';
import { accountEventsRepository } from './account-events.repository.js';

type AdminListRow = Awaited<
  ReturnType<typeof accountEventsRepository.findManyForAdmin>
>[number];

function toListDto(row: AdminListRow): AccountEventListItemDto {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    target_user_id: row.targetUserId,
    target_email: row.targetUser.email,
    target_app_name: row.targetUser.app.name,
    initiated_by_id: row.initiatedById,
    initiated_by_email: row.initiatedBy?.email ?? null,
    created_at: row.createdAt.toISOString(),
    completed_at: row.completedAt?.toISOString() ?? null,
  };
}

export const accountEventsService = {
  async listForAdmin(): Promise<AccountEventListItemDto[]> {
    const rows = await accountEventsRepository.findManyForAdmin();
    return rows.map(toListDto);
  },

  async findPendingPasswordChangeForUser(userId: number): Promise<PendingPasswordChangeDto | null> {
    const row = await accountEventsRepository.findPendingPasswordResetForUser(userId);
    if (!row) return null;
    return { event_id: row.id, type: 'password_reset_required' };
  },

  async markPasswordChangeRequired({
    targetUserId,
    initiatedById,
  }: {
    targetUserId: number;
    initiatedById: number | null;
  }): Promise<{ event_id: number }> {
    const user = await usersRepository.findById(targetUserId);
    if (!user) {
      throw new AppError('User not found', HttpError.NOT_FOUND);
    }
    const event = await accountEventsRepository.createPasswordResetRequired({
      targetUserId,
      initiatedById,
    });
    return { event_id: event.id };
  },

  async schedulePasswordReset({
    targetUserId,
    initiatedById,
  }: {
    targetUserId: number;
    initiatedById: number | null;
  }): Promise<{ temporary_password: string; event_id: number }> {
    const user = await usersRepository.findById(targetUserId);
    if (!user) {
      throw new AppError('User not found', HttpError.NOT_FOUND);
    }

    const temporary_password = generateRandomPassword(10);
    const passwordHash = await hashPassword(temporary_password);

    const event = await accountEventsRepository.applyAdminPasswordReset({
      targetUserId,
      initiatedById,
      passwordHash,
    });

    return { temporary_password, event_id: event.id };
  },

  async completePasswordChange({
    userId,
    eventId,
    newPassword,
  }: {
    userId: number;
    eventId: number;
    newPassword: string;
  }): Promise<void> {
    const event = await accountEventsRepository.findById(eventId);
    if (!event || event.targetUserId !== userId) {
      throw new AppError('Password change request not found', HttpError.NOT_FOUND);
    }
    if (event.status !== 'pending') {
      throw new AppError('Password change request is no longer pending', HttpError.BAD_REQUEST);
    }

    const passwordHash = await hashPassword(newPassword);
    await usersRepository.updatePassword(userId, passwordHash);
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await accountEventsRepository.complete(eventId);
  },
};
