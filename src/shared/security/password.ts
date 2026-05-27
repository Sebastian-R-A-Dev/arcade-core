import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$/;

/** Hash irreversible (bcrypt). Nunca almacenar ni devolver la contraseña en texto plano. */
export async function hashPassword(plainPassword: string): Promise<string> {
  const trimmed = plainPassword.trim();
  if (!trimmed) {
    throw new Error('Password cannot be empty');
  }
  return bcrypt.hash(trimmed, env.bcryptSaltRounds);
}

/** Compara contraseña en texto plano con el hash guardado en BD. */
export async function verifyPassword(plainPassword: string, storedPasswordHash: string): Promise<boolean> {
  if (!storedPasswordHash || !BCRYPT_HASH_PATTERN.test(storedPasswordHash)) {
    return false;
  }
  return bcrypt.compare(plainPassword.trim(), storedPasswordHash);
}

export function isPasswordHash(value: string): boolean {
  return BCRYPT_HASH_PATTERN.test(value);
}
