import { env } from '../../shared/config/env.js';
import { userProgressRepository } from '../user-progress/user-progress.repository.js';
import { userProgressService } from '../user-progress/user-progress.service.js';

export const CHAT_XP_PER_INTERVAL = env.chatXpPerInterval;
export const CHAT_HEARTBEAT_SECONDS = 60;

export function chatXpIntervalSeconds(): number {
  return env.chatXpIntervalMinutes * 60;
}

type HeartbeatState = {
  accumulatedSeconds: number;
  lastTickAt: number;
};

const heartbeatState = new Map<string, HeartbeatState>();

function stateKey(userId: number, appId: number): string {
  return `${appId}:${userId}`;
}

export const chatXpHeartbeat = {
  reset(userId: number, appId: number) {
    heartbeatState.delete(stateKey(userId, appId));
  },

  async tick(
    userId: number,
    appId: number,
    visible: boolean,
  ): Promise<{ gained: number; progress: Awaited<ReturnType<typeof userProgressService.getForUser>> } | null> {
    if (!visible) return null;

    const intervalSeconds = chatXpIntervalSeconds();
    const key = stateKey(userId, appId);
    const now = Date.now();
    const prev = heartbeatState.get(key) ?? { accumulatedSeconds: 0, lastTickAt: now };

    const elapsed = Math.floor((now - prev.lastTickAt) / 1000);
    prev.lastTickAt = now;
    prev.accumulatedSeconds += Math.min(elapsed, CHAT_HEARTBEAT_SECONDS * 2);

    let gained = 0;
    while (prev.accumulatedSeconds >= intervalSeconds) {
      prev.accumulatedSeconds -= intervalSeconds;
      gained += CHAT_XP_PER_INTERVAL;
    }

    heartbeatState.set(key, prev);

    if (gained <= 0) {
      const progress = await userProgressService.getForUser(userId);
      return { gained: 0, progress };
    }

    await userProgressRepository.applyXpGainOnly(userId, gained);
    const progress = await userProgressService.getForUser(userId);
    return { gained, progress };
  },
};
