import type { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';
import type { ChatMessageJson } from './chat.types.js';

export const MAX_PRIVATE_MESSAGES = 50;

export function orderPeerIds(a: number, b: number): { low: number; high: number } {
  return a < b ? { low: a, high: b } : { low: b, high: a };
}

function parseMessages(raw: unknown): ChatMessageJson[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (m): m is ChatMessageJson =>
      !!m &&
      typeof m === 'object' &&
      typeof (m as ChatMessageJson).id === 'string' &&
      typeof (m as ChatMessageJson).text === 'string' &&
      typeof (m as ChatMessageJson).created_at === 'string',
  );
}

export const chatRepository = {
  async findConversationsForUser(appId: number, userId: number) {
    return prisma.chatPrivateConversation.findMany({
      where: {
        appId,
        OR: [{ userLowId: userId }, { userHighId: userId }],
      },
      include: {
        userLow: { include: { profile: true, progress: true, role: true } },
        userHigh: { include: { profile: true, progress: true, role: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async findConversation(appId: number, userId: number, peerUserId: number) {
    const { low, high } = orderPeerIds(userId, peerUserId);
    return prisma.chatPrivateConversation.findUnique({
      where: { appId_userLowId_userHighId: { appId, userLowId: low, userHighId: high } },
    });
  },

  async appendPrivateMessage(
    appId: number,
    userId: number,
    peerUserId: number,
    message: ChatMessageJson,
  ) {
    const { low, high } = orderPeerIds(userId, peerUserId);
    const existing = await prisma.chatPrivateConversation.findUnique({
      where: { appId_userLowId_userHighId: { appId, userLowId: low, userHighId: high } },
    });

    const prev = existing ? parseMessages(existing.messagesJson) : [];
    const next = [...prev, message].slice(-MAX_PRIVATE_MESSAGES);

    return prisma.chatPrivateConversation.upsert({
      where: { appId_userLowId_userHighId: { appId, userLowId: low, userHighId: high } },
      create: {
        appId,
        userLowId: low,
        userHighId: high,
        messagesJson: next as unknown as Prisma.InputJsonValue,
      },
      update: { messagesJson: next as unknown as Prisma.InputJsonValue },
    });
  },

  async findUserWithProfile(userId: number) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true, progress: true, role: true },
    });
  },
};
