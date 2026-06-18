/**
 * Inserta o actualiza los tipos de pregunta por defecto (idempotente).
 * Uso: npx tsx prisma/seed-question-types.ts
 * También se ejecuta desde prisma/seed.ts (db:seed).
 */
import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { DEFAULT_QUESTION_TYPES } from '../src/shared/constants/defaultQuestionTypes.js';

const prisma = new PrismaClient();

export async function ensureDefaultQuestionTypes(client: PrismaClient = prisma): Promise<void> {
  for (const row of DEFAULT_QUESTION_TYPES) {
    await client.questionTypeCatalog.upsert({
      where: { slug: row.slug },
      create: {
        slug: row.slug,
        label: row.label,
        description: row.description,
        sortOrder: row.sort_order,
        isActive: true,
      },
      update: {
        label: row.label,
        description: row.description,
        sortOrder: row.sort_order,
        isActive: true,
      },
    });
  }
  console.log(`[seed-question-types] ${DEFAULT_QUESTION_TYPES.length} tipos de pregunta listos.`);
}

async function main(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.questionTypeCatalog.count();
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021') {
      console.error('[seed-question-types] Aplica migraciones antes de ejecutar este script.');
      process.exit(1);
    }
    throw e;
  }
  await ensureDefaultQuestionTypes();
}

const isDirectRun = process.argv[1]?.includes('seed-question-types');
if (isDirectRun) {
  main()
    .catch((e) => {
      console.error('[seed-question-types] Failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
