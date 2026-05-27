import { randomBytes } from 'node:crypto';

const CHARSET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/** Contraseña temporal alfanumérica (p. ej. reset admin o alta desde panel). */
export function generateRandomPassword(length = 10): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += CHARSET[bytes[i]! % CHARSET.length];
  }
  return out;
}
