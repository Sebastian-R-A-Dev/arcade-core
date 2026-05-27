import dotenv from 'dotenv';

dotenv.config();

/** Raíz del proyecto: `https://<ref>.supabase.co` — sin `/rest/v1` ni rutas extra. */
function normalizeSupabaseProjectUrl(raw: string): string {
  let u = raw.trim().replace(/\/+$/, '');
  if (!u) return u;
  u = u.replace(/\/rest\/v1\/?$/i, '');
  u = u.replace(/\/graphql\/v1\/?$/i, '');
  return u.replace(/\/+$/, '');
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: required('DATABASE_URL'),
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS ?? 12),
  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresDays: Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 1),
  /** Allowed browser origins for credentialed CORS (comma-separated). */
  corsOrigins: (
    process.env.CORS_ORIGINS ??
    'http://localhost:3000,http://localhost:3001,http://localhost:3002'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  refreshCookieName: process.env.REFRESH_COOKIE_NAME?.trim() || 'arcade_refresh',
  challengeCookieName: process.env.CHALLENGE_COOKIE_NAME?.trim() || 'arcade_challenge',
  challengeSessionHours: Number(process.env.CHALLENGE_SESSION_HOURS ?? 24),
  /** Preguntas por partida (denominador de score / XP). */
  challengeQuestionsPerSession: Number(process.env.CHALLENGE_QUESTIONS_PER_SESSION ?? 10),
  /** Segundos para responder cada pregunta (sin contar grace UI). */
  challengeQuestionSeconds: Number(process.env.CHALLENGE_QUESTION_SECONDS ?? 20),
  /** Segundos extra en servidor para animaciones de ruleta + intro (anti-cheat incluye esto). */
  challengeUiGraceSeconds: Number(process.env.CHALLENGE_UI_GRACE_SECONDS ?? 3),
  /** HTTPS / prod: Secure cookies; cross-site apps need SameSite=None + Secure. */
  cookieSecure: process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production',
  cookieSameSite:
    (process.env.COOKIE_SAME_SITE as 'lax' | 'strict' | 'none' | undefined) ??
    (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),

  /** Supabase: URL raíz del proyecto + service_role en SUPABASE_KEY (Storage admin). */
  supabaseUrl: normalizeSupabaseProjectUrl(process.env.SUPABASE_URL?.trim() ?? ''),
  supabaseKey: process.env.SUPABASE_KEY?.trim() ?? '',
  /** Bucket Storage (`QUESTIONS_IMAGES_BUCKET`). Por defecto `questions-images`. */
  questionsImagesBucket:
    process.env.QUESTIONS_IMAGES_BUCKET?.trim() || 'questions-images',
  /** Bucket Storage para pistas MP3 globales (`AUDIOS_FOR_APPS_BUCKET`). */
  audiosForAppsBucket:
    process.env.AUDIOS_FOR_APPS_BUCKET?.trim() || 'audios-for-apps',
};
