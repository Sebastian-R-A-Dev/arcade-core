-- Add app_id to users (nullable first for backfill)
ALTER TABLE "users" ADD COLUMN "app_id" INTEGER;

-- Ensure at least one app exists for legacy rows (name unique; panel de administración base)
INSERT INTO "apps" ("name", "type", "is_active")
SELECT 'ADMIN_APP', 'quiz'::"AppType", true
WHERE NOT EXISTS (SELECT 1 FROM "apps");

-- Assign all existing users to the first app by id (or the legacy placeholder)
UPDATE "users" u
SET "app_id" = (SELECT "id" FROM "apps" ORDER BY "id" ASC LIMIT 1)
WHERE u."app_id" IS NULL;

ALTER TABLE "users" ALTER COLUMN "app_id" SET NOT NULL;

-- Drop global unique on email
DROP INDEX IF EXISTS "users_email_key";

-- Link users to apps
ALTER TABLE "users"
  ADD CONSTRAINT "users_app_id_fkey"
  FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Email unique within each app
CREATE UNIQUE INDEX "users_email_app_id_key" ON "users" ("email", "app_id");
