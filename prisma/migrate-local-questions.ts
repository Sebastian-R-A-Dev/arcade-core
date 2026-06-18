/**
 * Copia difficulties + questions desde Postgres local a la BD actual (Supabase).
 * Las preguntas viven en la BD, no en csv/ (esa carpeta está vacía/gitignored).
 *
 * Uso:
 *   LOCAL_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/arcadecore" npm run db:migrate-local-questions
 *
 * Requiere Postgres local accesible y DATABASE_URL apuntando a prod/Supabase.
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const TARGET_APP_NAME = 'ENGLISH-CHALLENGE';

const localUrl =
  process.env.LOCAL_DATABASE_URL?.trim() ||
  'postgresql://postgres:postgres@localhost:5432/arcadecore';

const local = new PrismaClient({
  datasources: { db: { url: localUrl } },
});
const remote = new PrismaClient();

async function main(): Promise<void> {
  const force = process.argv.includes('--force');

  const localApp = await local.app.findUnique({ where: { name: TARGET_APP_NAME } });
  const remoteApp = await remote.app.findUnique({ where: { name: TARGET_APP_NAME } });
  if (!localApp) {
    throw new Error(`Local DB: app "${TARGET_APP_NAME}" not found`);
  }
  if (!remoteApp) {
    throw new Error(`Target DB: app "${TARGET_APP_NAME}" not found — run db:seed first`);
  }

  const existingQuestions = await remote.question.count({ where: { appId: remoteApp.id } });
  if (existingQuestions > 0 && !force) {
    console.log(
      `[migrate-questions] Target already has ${existingQuestions} questions for ${TARGET_APP_NAME}.`,
    );
    console.log('[migrate-questions] Use --force to append anyway (may duplicate).');
    return;
  }

  const localDiffs = await local.difficulty.findMany({
    where: { appId: localApp.id },
    orderBy: { id: 'asc' },
  });

  const diffIdMap = new Map<number, number>();
  for (const d of localDiffs) {
    const existing = await remote.difficulty.findFirst({
      where: { appId: remoteApp.id, name: d.name },
    });
    if (existing) {
      diffIdMap.set(d.id, existing.id);
      console.log(`[migrate-questions] difficulty exists: ${d.name} → id ${existing.id}`);
    } else {
      const created = await remote.difficulty.create({
        data: { appId: remoteApp.id, name: d.name, isActive: d.isActive },
      });
      diffIdMap.set(d.id, created.id);
      console.log(`[migrate-questions] + difficulty: ${d.name} → id ${created.id}`);
    }
  }

  const localImages = await local.image.findMany();
  const remoteImages = await remote.image.findMany();
  const imageIdMap = new Map<number, number>();
  for (const li of localImages) {
    const match = remoteImages.find(
      (r) => r.uuid === li.uuid || r.storagePath === li.storagePath,
    );
    if (match) imageIdMap.set(li.id, match.id);
  }

  const localQuestions = await local.question.findMany({
    where: { appId: localApp.id },
    orderBy: { id: 'asc' },
  });

  let created = 0;
  for (const q of localQuestions) {
    const difficultyId = diffIdMap.get(q.difficultyId);
    if (!difficultyId) {
      console.warn(`[migrate-questions] skip question ${q.id}: unknown difficulty ${q.difficultyId}`);
      continue;
    }

    const imageId =
      q.imageId != null ? (imageIdMap.get(q.imageId) ?? null) : null;
    if (q.imageId != null && imageId == null) {
      console.warn(
        `[migrate-questions] question ${q.id}: image_id ${q.imageId} not found in target — setting null`,
      );
    }

    await remote.question.create({
      data: {
        appId: remoteApp.id,
        difficultyId,
        questionTypeId: q.questionTypeId,
        question: q.question,
        options: q.options,
        answer: q.answer,
        imageUrl: q.imageUrl,
        imageName: q.imageName,
        imageId,
      },
    });
    created += 1;
  }

  console.log(
    `[migrate-questions] done: ${created} questions, ${localDiffs.length} difficulties for ${TARGET_APP_NAME}`,
  );
}

main()
  .catch((e) => {
    console.error('[migrate-questions] failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await local.$disconnect();
    await remote.$disconnect();
  });
