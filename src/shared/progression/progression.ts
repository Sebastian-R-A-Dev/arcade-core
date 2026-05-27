export const MAX_PLAYER_LEVEL = 1000;
export const BASE_PERFECT_SESSION_XP = 1000;
export const MAX_ANSWER_ATTEMPTS_PER_QUESTION = 3;

/** Puntos por respuesta acertada (también en intentos fallidos parciales). */
export const SCORE_PER_CORRECT_ANSWER = 150;
/** Bonus al completar el reto sin errores. */
export const SCORE_PERFECT_RUN_BONUS = 3_000;
/** XP extra al ganar el reto (además del XP de sesión). */
export const WIN_BONUS_XP = 500;

/** XP necesaria para pasar del nivel L al L+1 (L < MAX_PLAYER_LEVEL). */
export function xpRequiredForNextLevel(level: number): number {
  if (level < 0 || level >= MAX_PLAYER_LEVEL) return 0;
  return Math.floor(BASE_PERFECT_SESSION_XP * 1.1 ** level);
}

/** XP otorgada al terminar una partida según aciertos vs total de preguntas de la app. */
export function sessionXpFromCorrectAnswers(correctCount: number, totalQuestions: number): number {
  if (totalQuestions <= 0 || correctCount <= 0) return 0;
  const capped = Math.min(correctCount, totalQuestions);
  return Math.floor((capped / totalQuestions) * BASE_PERFECT_SESSION_XP);
}

/** Aplica XP ganada y devuelve el progreso resultante (sin persistir). */
export function applyXpGain(
  level: number,
  xp: number,
  gained: number,
): { level: number; xp: number } {
  let nextLevel = level;
  let nextXp = xp + gained;

  if (nextLevel >= MAX_PLAYER_LEVEL) {
    return { level: MAX_PLAYER_LEVEL, xp: 0 };
  }

  while (nextLevel < MAX_PLAYER_LEVEL) {
    const need = xpRequiredForNextLevel(nextLevel);
    if (nextXp < need) break;
    nextXp -= need;
    nextLevel += 1;
  }

  if (nextLevel >= MAX_PLAYER_LEVEL) {
    return { level: MAX_PLAYER_LEVEL, xp: 0 };
  }

  return { level: nextLevel, xp: nextXp };
}

export type ProgressSnapshot = {
  level: number;
  xp: number;
  xp_required_for_next_level: number | null;
  xp_to_next_level: number | null;
  is_max_level: boolean;
};

/** Puntos de leaderboard sumados al terminar un intento de reto. */
export function leaderboardScoreForSession(
  correctCount: number,
  totalQuestions: number,
  completed: boolean,
): number {
  const fromCorrect = Math.max(0, correctCount) * SCORE_PER_CORRECT_ANSWER;
  if (!completed || totalQuestions <= 0) return fromCorrect;
  const completionBonus = totalQuestions * SCORE_PER_CORRECT_ANSWER;
  return fromCorrect + completionBonus + SCORE_PERFECT_RUN_BONUS;
}

/** Etiqueta tipo “liga” para la UI del ranking según nivel numérico. */
export function levelToTierLabel(level: number): string {
  const l = Math.min(Math.max(level, 0), MAX_PLAYER_LEVEL);
  if (l >= 90) return 'S+';
  if (l >= 70) return 'S';
  if (l >= 50) return 'A+';
  if (l >= 35) return 'A';
  if (l >= 20) return 'B+';
  if (l >= 10) return 'B';
  if (l >= 5) return 'C+';
  return 'C';
}

export function toProgressSnapshot(level: number, xp: number): ProgressSnapshot {
  const clampedLevel = Math.min(Math.max(level, 0), MAX_PLAYER_LEVEL);
  if (clampedLevel >= MAX_PLAYER_LEVEL) {
    return {
      level: MAX_PLAYER_LEVEL,
      xp: 0,
      xp_required_for_next_level: null,
      xp_to_next_level: null,
      is_max_level: true,
    };
  }
  const required = xpRequiredForNextLevel(clampedLevel);
  return {
    level: clampedLevel,
    xp,
    xp_required_for_next_level: required,
    xp_to_next_level: Math.max(required - xp, 0),
    is_max_level: false,
  };
}
