import 'dotenv/config';
import bcrypt from 'bcrypt';
import { AppType, Prisma, PrismaClient } from '@prisma/client';
import { ADMIN_APP_NAME } from '../src/shared/constants/adminApp.js';
import { ensureDefaultQuestionTypes } from './seed-question-types.js';
import { ensureDefaultRoles } from './seed-roles.js';
import { ensureLevelMilestoneMessages, ENGLISH_CHALLENGE_APP_NAME } from './seed-level-messages.js';
import { ROLE_SLUG_ADMINISTRATOR } from '../src/shared/constants/defaultRoles.js';

const prisma = new PrismaClient();
const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'admin@admin';

function isMissingRelationError(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021';
}

async function assertMigrationsApplied(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.app.count();
  } catch (e: unknown) {
    if (isMissingRelationError(e)) {
      console.error(
        '[seed] La base de datos no tiene las tablas creadas (migraciones no aplicadas en esta BD).',
      );
      console.error('[seed] Aplica las migraciones y vuelve a ejecutar el seed:');
      console.error('        npm run prisma:migrate          # desarrollo (interactivo)');
      console.error('        npx prisma migrate deploy       # CI / producción');
      console.error('        npm run db:setup                # deploy + seed (sin prompts)');
      await prisma.$disconnect();
      process.exit(1);
    }
    throw e;
  }
}

const DEFAULT_ADMIN_APP_URL = 'http://localhost:3001';
const DEFAULT_ENGLISH_CHALLENGE_URL = 'http://localhost:3002';
const DEFAULT_CHAT_APP_URL = 'http://localhost:3003';
const CHAT_APP_NAME = 'CHAT-BOX';

/** Garantiza una sola fila ADMIN_APP (nombre único en BD); idempotente para prod. */
async function ensureAdminApp(): Promise<{ id: number }> {
  const existing = await prisma.app.findUnique({
    where: { name: ADMIN_APP_NAME },
  });

  if (existing) {
    if (existing.type !== AppType.administration || !existing.isActive) {
      await prisma.app.update({
        where: { id: existing.id },
        data: { type: AppType.administration, isActive: true },
      });
      console.log('[seed] ADMIN_APP actualizada (tipo administration, activa).');
    } else {
      console.log('[seed] ADMIN_APP ya existe y está correcta.');
    }
    return { id: existing.id };
  }

  const created = await prisma.app.create({
    data: {
      name: ADMIN_APP_NAME,
      url: DEFAULT_ADMIN_APP_URL,
      type: AppType.administration,
      isActive: true,
    },
  });
  console.log(`[seed] Creada "${ADMIN_APP_NAME}" (tipo administration).`);
  return { id: created.id };
}

/** Garantiza app CHAT-BOX para arcade-chat. */
async function ensureChatApp(): Promise<{ id: number }> {
  const existing = await prisma.app.findUnique({
    where: { name: CHAT_APP_NAME },
  });

  if (existing) {
    if (existing.type !== AppType.chat || !existing.isActive) {
      await prisma.app.update({
        where: { id: existing.id },
        data: { type: AppType.chat, isActive: true, url: DEFAULT_CHAT_APP_URL },
      });
      console.log('[seed] CHAT-BOX actualizada (tipo chat, activa).');
    } else {
      console.log('[seed] CHAT-BOX ya existe y está correcta.');
    }
    return { id: existing.id };
  }

  const created = await prisma.app.create({
    data: {
      name: CHAT_APP_NAME,
      url: DEFAULT_CHAT_APP_URL,
      type: AppType.chat,
      isActive: true,
    },
  });
  console.log(`[seed] Creada "${CHAT_APP_NAME}" (tipo chat).`);
  return { id: created.id };
}

/** Garantiza app ENGLISH-CHALLENGE para english-challenge. */
async function ensureEnglishChallengeApp(): Promise<{ id: number }> {
  const existing = await prisma.app.findUnique({
    where: { name: ENGLISH_CHALLENGE_APP_NAME },
  });

  if (existing) {
    if (existing.type !== AppType.quiz || !existing.isActive) {
      await prisma.app.update({
        where: { id: existing.id },
        data: { type: AppType.quiz, isActive: true, url: DEFAULT_ENGLISH_CHALLENGE_URL },
      });
      console.log('[seed] ENGLISH-CHALLENGE actualizada (tipo quiz, activa).');
    } else {
      console.log('[seed] ENGLISH-CHALLENGE ya existe y está correcta.');
    }
    return { id: existing.id };
  }

  const created = await prisma.app.create({
    data: {
      name: ENGLISH_CHALLENGE_APP_NAME,
      url: DEFAULT_ENGLISH_CHALLENGE_URL,
      type: AppType.quiz,
      isActive: true,
    },
  });
  console.log(`[seed] Creada "${ENGLISH_CHALLENGE_APP_NAME}" (tipo quiz).`);
  return { id: created.id };
}

async function main(): Promise<void> {
  await assertMigrationsApplied();

  const bcryptRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);

  const adminApp = await ensureAdminApp();
  await ensureEnglishChallengeApp();
  await ensureChatApp();
  await ensureDefaultRoles(prisma);
  await ensureDefaultQuestionTypes(prisma);
  await ensureLevelMilestoneMessages(prisma);

  const adminRole = await prisma.role.findUnique({
    where: { slug: ROLE_SLUG_ADMINISTRATOR },
  });
  if (!adminRole) {
    throw new Error('[seed] Administrator role missing after seed-roles');
  }

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, bcryptRounds);
    await prisma.user.create({
      data: {
        appId: adminApp.id,
        roleId: adminRole.id,
        email: ADMIN_EMAIL,
        password: passwordHash,
        profile: {
          create: { appId: adminApp.id, nickname: 'Admin' },
        },
      },
    });
    console.log(
      `[seed] Usuario por defecto "${ADMIN_EMAIL}" (app_id=${adminApp.id}). Contraseña: la definida en el script de seed.`,
    );
  } else {
    console.log('[seed] Ya hay usuarios; no se crea el admin.');
    await prisma.user.updateMany({
      where: {
        appId: adminApp.id,
        email: ADMIN_EMAIL,
        roleId: { not: adminRole.id },
      },
      data: { roleId: adminRole.id },
    });
  }
}

main()
  .catch((e) => {
    if (isMissingRelationError(e)) {
      console.error(
        '[seed] Tabla inexistente (P2021). Comprueba DATABASE_URL y que las migraciones estén aplicadas.',
      );
      process.exit(1);
    }
    console.error('[seed] Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
