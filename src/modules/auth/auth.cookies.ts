import type { CookieOptions, Response } from 'express';
import { env } from '../../shared/config/env.js';

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

/** One HttpOnly refresh cookie per App.name so admin and player SPAs do not clobber each other. */
export function refreshCookieNameForApp(appName: string): string {
  const suffix = appName.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  if (!suffix) {
    throw new Error('Invalid app name for refresh cookie');
  }
  return `${env.refreshCookieName}_${suffix}`;
}

export function refreshCookieOptions(): CookieOptions {
  const maxAgeSeconds = env.jwtRefreshExpiresDays * 24 * 60 * 60;
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
    maxAge: maxAgeSeconds * 1000,
  };
}

export function clearRefreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: '/',
    maxAge: 0,
  };
}

export function setRefreshTokenCookie(res: Response, refreshToken: string, appName: string): void {
  res.cookie(refreshCookieNameForApp(appName), refreshToken, refreshCookieOptions());
  res.clearCookie(env.refreshCookieName, clearRefreshCookieOptions());
}

export function clearRefreshTokenCookie(res: Response, appName: string): void {
  res.clearCookie(refreshCookieNameForApp(appName), clearRefreshCookieOptions());
  res.clearCookie(env.refreshCookieName, clearRefreshCookieOptions());
}

export function getRefreshTokenFromRequest(
  req: { headers: { cookie?: string | string[] | undefined } },
  appName?: string,
): string | undefined {
  const cookieHeader = req.headers.cookie;
  const header = Array.isArray(cookieHeader) ? cookieHeader.join('; ') : cookieHeader;
  const parsed = parseCookieHeader(header);

  if (appName?.trim()) {
    const perApp = parsed[refreshCookieNameForApp(appName)];
    if (typeof perApp === 'string' && perApp.trim()) return perApp.trim();
  }

  const legacy = parsed[env.refreshCookieName];
  return typeof legacy === 'string' && legacy.trim() ? legacy.trim() : undefined;
}
