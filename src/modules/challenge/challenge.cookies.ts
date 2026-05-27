import type { CookieOptions, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../shared/config/env.js';

export type ChallengeSessionPayload = {
  sid: number;
  uid: number;
  appId: number;
};

function parseCookieHeader(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    let val = part.slice(idx + 1).trim();
    try {
      val = decodeURIComponent(val);
    } catch {
      /* keep raw */
    }
    out[key] = val;
  }
  return out;
}

export function challengeCookieOptions(): CookieOptions {
  const maxAgeSeconds = env.challengeSessionHours * 60 * 60;
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
    maxAge: maxAgeSeconds * 1000,
  };
}

export function clearChallengeCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
    maxAge: 0,
  };
}

export function signChallengeSession(payload: ChallengeSessionPayload): string {
  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: `${env.challengeSessionHours}h`,
  });
}

export function verifyChallengeSession(token: string): ChallengeSessionPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret);
    if (!decoded || typeof decoded !== 'object') return null;
    const sid = Number((decoded as { sid?: unknown }).sid);
    const uid = Number((decoded as { uid?: unknown }).uid);
    const appId = Number((decoded as { appId?: unknown }).appId);
    if (!Number.isInteger(sid) || sid < 1) return null;
    if (!Number.isInteger(uid) || uid < 1) return null;
    if (!Number.isInteger(appId) || appId < 1) return null;
    return { sid, uid, appId };
  } catch {
    return null;
  }
}

export function setChallengeSessionCookie(res: Response, token: string): void {
  res.cookie(env.challengeCookieName, token, challengeCookieOptions());
}

export function clearChallengeSessionCookie(res: Response): void {
  res.clearCookie(env.challengeCookieName, clearChallengeCookieOptions());
}

export function getChallengeSessionFromRequest(req: {
  headers: { cookie?: string | string[] | undefined };
}): string | undefined {
  const cookieHeader = req.headers.cookie;
  const header = Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader;
  const raw = parseCookieHeader(header)[env.challengeCookieName];
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}
