import { randomUUID } from 'node:crypto';
import { ROLE_SLUG_ADMINISTRATOR } from '../../shared/constants/defaultRoles.js';
import { HttpError } from '../../shared/constants/httpError.js';
import { toProgressSnapshot } from '../../shared/progression/progression.js';
import { AppError } from '../../shared/utils/AppError.js';
import { userProgressService } from '../user-progress/user-progress.service.js';
import { chatRepository } from './chat.repository.js';
import { chatXpHeartbeat } from './chat.xp-heartbeat.js';
import type {
  ChatMessageDto,
  ChatMessageJson,
  ChatPrivateConversationSummaryDto,
  ChatPrivateHistoryDto,
} from './chat.types.js';
import type { ChatHeartbeatBody } from './chat.validation.js';

const MAX_MESSAGE_LENGTH = 2000;

function parseMessages(raw: unknown): ChatMessageJson[] {
  if (!Array.isArray(raw)) return [];
  return raw as ChatMessageJson[];
}

function toMessageDto(m: ChatMessageJson): ChatMessageDto {
  return {
    id: m.id,
    type: m.type ?? 'user',
    text: m.text,
    created_at: m.created_at,
    from_user_id: m.from_user_id,
    image_url: m.image_url,
  };
}

function isGm(roleSlug: string | undefined): boolean {
  return roleSlug === ROLE_SLUG_ADMINISTRATOR;
}

function peerFromRow(
  row: Awaited<ReturnType<typeof chatRepository.findConversationsForUser>>[number],
  userId: number,
) {
  const isLow = row.userLowId === userId;
  const peer = isLow ? row.userHigh : row.userLow;
  return {
    peerUserId: isLow ? row.userHighId : row.userLowId,
    peer,
  };
}

export const chatService = {
  normalizeOutgoingText(text: string): string {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new AppError('Message text is required', HttpError.BAD_REQUEST);
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw new AppError('Message too long', HttpError.BAD_REQUEST);
    }
    return trimmed;
  },

  createUserMessage(fromUserId: number, text: string, imageUrl?: string): ChatMessageJson {
    return {
      id: randomUUID(),
      type: 'user',
      from_user_id: fromUserId,
      text,
      image_url: imageUrl,
      created_at: new Date().toISOString(),
    };
  },

  createSystemMessage(text: string): ChatMessageJson {
    return {
      id: randomUUID(),
      type: 'system',
      text,
      created_at: new Date().toISOString(),
    };
  },

  async listPrivateConversations(
    userId: number,
    appId: number,
  ): Promise<ChatPrivateConversationSummaryDto[]> {
    const rows = await chatRepository.findConversationsForUser(appId, userId);
    return rows.map((row) => {
      const { peerUserId, peer } = peerFromRow(row, userId);
      const messages = parseMessages(row.messagesJson);
      const last = messages.length > 0 ? messages[messages.length - 1] : null;
      return {
        peer_user_id: peerUserId,
        peer_nickname: peer.profile?.nickname ?? `User ${peerUserId}`,
        peer_avatar_url: peer.profile?.avatarUrl ?? null,
        last_message: last ? toMessageDto(last) : null,
        updated_at: row.updatedAt.toISOString(),
      };
    });
  },

  async getPrivateHistory(
    userId: number,
    appId: number,
    peerUserId: number,
  ): Promise<ChatPrivateHistoryDto> {
    const row = await chatRepository.findConversation(appId, userId, peerUserId);
    const messages = row ? parseMessages(row.messagesJson).map(toMessageDto) : [];
    return { peer_user_id: peerUserId, messages };
  },

  async heartbeat(userId: number, appId: number, body: ChatHeartbeatBody) {
    const result = await chatXpHeartbeat.tick(userId, appId, body.visible);
    if (!result) {
      const progress = await userProgressService.getForUser(userId);
      return {
        progress: toProgressSnapshot(progress.level, progress.xp),
      };
    }
    return {
      progress: toProgressSnapshot(result.progress.level, result.progress.xp),
      xp_gained: result.gained > 0 ? result.gained : undefined,
    };
  },

  async getMe(userId: number) {
    const user = await chatRepository.findUserWithProfile(userId);
    if (!user) {
      throw new AppError('User not found', HttpError.NOT_FOUND);
    }
    const progress = await userProgressService.getForUser(userId);
    return {
      id: user.id,
      email: user.email,
      profile: user.profile
        ? {
            nickname: user.profile.nickname,
            avatar_url: user.profile.avatarUrl,
          }
        : null,
      progress,
      is_gm: isGm(user.role.slug),
    };
  },

  toOnlineUserDto(user: NonNullable<Awaited<ReturnType<typeof chatRepository.findUserWithProfile>>>) {
    return {
      user_id: user.id,
      nickname: user.profile?.nickname ?? `User ${user.id}`,
      avatar_url: user.profile?.avatarUrl ?? null,
      level: user.progress?.level ?? 0,
      is_gm: isGm(user.role.slug),
    };
  },

  toMessageDto,
};
