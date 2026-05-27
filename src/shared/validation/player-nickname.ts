export const PLAYER_NICKNAME_MAX_LENGTH = 64;

/** Solo letras ASCII y números (registro público / jugadores). */
export const PLAYER_NICKNAME_ALNUM_REGEX = /^[A-Za-z0-9]+$/;

const BRACKETED_GM = /[\[\(\{]\s*gm\s*[\]\)\}]/i;

/** Etiqueta staff [GM] y variantes con corchetes/paréntesis. */
export function isReservedGmNickname(nickname: string): boolean {
  const trimmed = nickname.trim();
  if (!trimmed) return false;
  if (BRACKETED_GM.test(trimmed)) return true;

  const compact = trimmed.replace(/[\[\]\(\)\{\}\s._-]/g, '');
  if (compact.toLowerCase() === 'gm') return true;

  if (/^gm(\d|[a-z])/i.test(trimmed)) return true;

  return false;
}

export function getPlayerNicknameError(nickname: string): string | null {
  const trimmed = nickname.trim();
  if (!trimmed) {
    return 'El nickname es obligatorio.';
  }
  if (trimmed.length > PLAYER_NICKNAME_MAX_LENGTH) {
    return `El nickname no puede superar ${PLAYER_NICKNAME_MAX_LENGTH} caracteres.`;
  }
  if (!PLAYER_NICKNAME_ALNUM_REGEX.test(trimmed)) {
    return 'El nickname solo puede contener letras y números (sin espacios ni signos).';
  }
  if (isReservedGmNickname(trimmed)) {
    return 'Ese nickname está reservado (no se permite [GM] ni variantes).';
  }
  return null;
}

export function sanitizePlayerNicknameInput(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').slice(0, PLAYER_NICKNAME_MAX_LENGTH);
}
