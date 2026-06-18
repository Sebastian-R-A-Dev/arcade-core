-- AlterTable
ALTER TABLE "apps" ADD COLUMN "url" VARCHAR(2048);

UPDATE "apps" SET "url" = 'http://localhost:3001' WHERE "url" IS NULL;

ALTER TABLE "apps" ALTER COLUMN "url" SET NOT NULL;
