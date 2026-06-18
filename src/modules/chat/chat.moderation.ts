import { env } from '../../shared/config/env.js';

const DEFAULT_RATE_LIMIT = 30;
const WINDOW_MS = 60_000;

const BANNED_WORDS = ['spamlink', 'hackfree'];

type RateBucket = { count: number; windowStart: number };

const rateBuckets = new Map<string, RateBucket>();

function rateLimitPerMin(): number {
  return env.chatRateLimitPerMin ?? DEFAULT_RATE_LIMIT;
}

export type ModerationResult =
  | { ok: true }
  | { ok: false; message: string; code: string };

export function checkRateLimit(userId: number, appId: number): ModerationResult {
  const key = `${appId}:${userId}`;
  const now = Date.now();
  const bucket = rateBuckets.get(key);

  if (!bucket || now - bucket.windowStart >= WINDOW_MS) {
    rateBuckets.set(key, { count: 1, windowStart: now });
    return { ok: true };
  }

  if (bucket.count >= rateLimitPerMin()) {
    return {
      ok: false,
      message: 'Estás enviando mensajes demasiado rápido. Espera un momento.',
      code: 'rate_limit',
    };
  }

  bucket.count += 1;
  return { ok: true };
}

export function checkMessageText(text: string): ModerationResult {
  const lower = text.toLowerCase();
  for (const word of BANNED_WORDS) {
    if (lower.includes(word)) {
      return {
        ok: false,
        message: 'Tu mensaje contiene contenido no permitido.',
        code: 'banned_word',
      };
    }
  }
  return { ok: true };
}

export function moderateOutgoingMessage(
  userId: number,
  appId: number,
  text: string,
): ModerationResult {
  const rate = checkRateLimit(userId, appId);
  if (!rate.ok) return rate;
  return checkMessageText(text);
}
