import crypto from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../../shared/config/env.js';
import type { TokenPair } from '../auth.types.js';
import { authRepository } from '../auth.repository.js';

function hashRefreshToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function generateRefreshTokenRaw(): string {
  return crypto.randomBytes(48).toString('hex');
}

function refreshExpiresAt(): Date {
  const ms = env.jwtRefreshExpiresDays * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
}

function signAccessToken(userId: number, email: string, appId: number, app_name: string): string {
  const options: SignOptions = {
    expiresIn: env.jwtAccessExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign({ sub: String(userId), email, appId, app_name }, env.jwtAccessSecret, options);
}

export const tokenIssuer = {
  hashRefreshToken,

  async issueTokenPair(
    userId: number,
    email: string,
    appId: number,
    app_name: string,
  ): Promise<TokenPair> {
    const access_token = signAccessToken(userId, email, appId, app_name);
    const refresh_token = generateRefreshTokenRaw();
    const tokenHash = hashRefreshToken(refresh_token);
    await authRepository.createRefreshToken({
      userId,
      tokenHash,
      expiresAt: refreshExpiresAt(),
    });
    return { access_token, refresh_token, expires_in: env.jwtAccessExpiresIn };
  },
};
