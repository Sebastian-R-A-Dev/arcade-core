import type { UserPublicDto } from '../users/users.types.js';

export type TokenPair = {
  access_token: string;
  refresh_token: string;
  expires_in: string;
};

export type PendingPasswordChangePublic = {
  event_id: number;
  type: 'password_reset_required';
};

export type AuthRegisterResult = {
  user: UserPublicDto;
  redirect_url: string;
  pending_password_change: PendingPasswordChangePublic | null;
} & TokenPair;

export type AuthLoginResult = {
  user: UserPublicDto;
  redirect_url: string;
  pending_password_change: PendingPasswordChangePublic | null;
} & TokenPair;

export type AuthRefreshResult = TokenPair & {
  app_name: string;
};

/** Tokens exposed in JSON (refresh lives in HttpOnly cookie). */
export type AuthTokensPublic = Pick<TokenPair, 'access_token' | 'expires_in'>;

export type AuthLoginResponsePublic = Omit<AuthLoginResult, 'refresh_token'>;

export type AuthRegisterResponsePublic = Omit<AuthRegisterResult, 'refresh_token'>;

export type AuthLogoutResult = {
  revoked: boolean;
  app_name?: string;
};
