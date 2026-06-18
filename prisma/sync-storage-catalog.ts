/**
 * Registra en Postgres las imágenes/avatares/audios que ya existen en Supabase Storage
 * pero no tienen fila en `images` / `app_audios` (p. ej. tras migrar BD sin exportar catálogo).
 *
 * Uso: npm run db:sync-storage
 * Requiere: DATABASE_URL, SUPABASE_URL, SUPABASE_KEY (service_role), buckets en .env
 */
import 'dotenv/config';
import { ImageKind, PrismaClient } from '@prisma/client';
import { getSupabaseStorageClient } from '../src/config/supabase.js';
import { env } from '../src/shared/config/env.js';

const prisma = new PrismaClient();

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ListedFile = { storagePath: string };

async function listAllFiles(bucket: string, prefix: string): Promise<ListedFile[]> {
  const supabase = getSupabaseStorageClient();
  const out: ListedFile[] = [];

  async function walk(folder: string): Promise<void> {
    const { data, error } = await supabase.storage.from(bucket).list(folder, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (error) {
      throw new Error(`[sync-storage] list ${bucket}/${folder}: ${error.message}`);
    }
    for (const entry of data ?? []) {
      const path = folder ? `${folder}/${entry.name}` : entry.name;
      if (entry.id == null) {
        await walk(path);
      } else {
        out.push({ storagePath: path });
      }
    }
  }

  await walk(prefix.replace(/\/$/, ''));
  return out;
}

function uuidFromPath(storagePath: string): string | null {
  const base = storagePath.split('/').pop() ?? '';
  const stem = base.replace(/\.[^.]+$/, '');
  return UUID_RE.test(stem) ? stem : null;
}

function displayNameFromPath(storagePath: string, uuid: string): string {
  const base = storagePath.split('/').pop() ?? uuid;
  const stem = base.replace(/\.[^.]+$/, '');
  return stem === uuid ? `Asset ${uuid.slice(0, 8)}` : stem;
}

async function syncImages(): Promise<{ created: number; skipped: number }> {
  const supabase = getSupabaseStorageClient();
  const bucket = env.questionsImagesBucket;
  let created = 0;
  let skipped = 0;

  const files = await listAllFiles(bucket, 'library');
  for (const { storagePath } of files) {
    if (!storagePath.endsWith('.webp')) continue;

    const uuid = uuidFromPath(storagePath);
    if (!uuid) {
      console.warn(`[sync-storage] skip image (no uuid in path): ${storagePath}`);
      skipped += 1;
      continue;
    }

    let kind: ImageKind = ImageKind.generic;
    if (storagePath.includes('/avatars/')) kind = ImageKind.avatar;
    else if (storagePath.includes('/generic/')) kind = ImageKind.generic;

    const existing = await prisma.image.findFirst({ where: { storagePath } });
    if (existing) {
      skipped += 1;
      continue;
    }

    const byUuid = await prisma.image.findUnique({ where: { uuid } });
    if (byUuid) {
      skipped += 1;
      continue;
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    await prisma.image.create({
      data: {
        uuid,
        kind,
        displayName: displayNameFromPath(storagePath, uuid),
        publicUrl: pub.publicUrl,
        storagePath,
      },
    });
    console.log(`[sync-storage] + image ${kind}: ${storagePath}`);
    created += 1;
  }

  return { created, skipped };
}

async function syncAudios(): Promise<{ created: number; skipped: number }> {
  const supabase = getSupabaseStorageClient();
  const bucket = env.audiosForAppsBucket;
  let created = 0;
  let skipped = 0;

  const files = await listAllFiles(bucket, 'tracks');
  for (const { storagePath } of files) {
    if (!storagePath.endsWith('.mp3')) continue;

    const uuid = uuidFromPath(storagePath);
    if (!uuid) {
      console.warn(`[sync-storage] skip audio (no uuid in path): ${storagePath}`);
      skipped += 1;
      continue;
    }

    const existing = await prisma.appAudio.findFirst({ where: { storagePath } });
    if (existing) {
      skipped += 1;
      continue;
    }

    const byUuid = await prisma.appAudio.findUnique({ where: { uuid } });
    if (byUuid) {
      skipped += 1;
      continue;
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(storagePath);
    await prisma.appAudio.create({
      data: {
        uuid,
        displayName: displayNameFromPath(storagePath, uuid),
        publicUrl: pub.publicUrl,
        storagePath,
      },
    });
    console.log(`[sync-storage] + audio: ${storagePath}`);
    created += 1;
  }

  return { created, skipped };
}

async function main(): Promise<void> {
  console.log('[sync-storage] buckets:', {
    images: env.questionsImagesBucket,
    audios: env.audiosForAppsBucket,
  });

  const images = await syncImages();
  const audios = await syncAudios();

  console.log('[sync-storage] done', { images, audios });
}

main()
  .catch((e) => {
    console.error('[sync-storage] failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
