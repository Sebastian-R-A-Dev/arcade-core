/**
 * Inserta roles por defecto (idempotente).
 * Uso: npx tsx prisma/seed-roles.ts
 */
import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { DEFAULT_ROLES } from '../src/shared/constants/defaultRoles.js';

const prisma = new PrismaClient();

export async function ensureDefaultRoles(client: PrismaClient = prisma): Promise<void> {
  for (const row of DEFAULT_ROLES) {
    await client.role.upsert({
      where: { slug: row.slug },
      create: { slug: row.slug, label: row.label },
      update: { label: row.label },
    });
  }
  console.log(`[seed-roles] ${DEFAULT_ROLES.length} roles listos.`);
}

async function main(): Promise<void> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    await prisma.role.count();
  } catch (e: unknown) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021') {
      console.error('[seed-roles] Aplica migraciones antes de ejecutar este script.');
      process.exit(1);
    }
    throw e;
  }
  await ensureDefaultRoles();
}

const isDirectRun = process.argv[1]?.includes('seed-roles');
if (isDirectRun) {
  main()
    .catch((e) => {
      console.error('[seed-roles] Failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
