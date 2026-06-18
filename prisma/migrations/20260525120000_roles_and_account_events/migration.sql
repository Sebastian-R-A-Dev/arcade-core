-- Global roles; users always have role_id. Account events for password reset flow.

CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "label" VARCHAR(128) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

INSERT INTO "roles" ("slug", "label") VALUES
    ('administrator', 'Administrator'),
    ('player', 'Player');

ALTER TABLE "users" ADD COLUMN "role_id" INTEGER;

UPDATE "users" u
SET "role_id" = (SELECT id FROM "roles" WHERE slug = 'administrator')
FROM "apps" a
WHERE u."app_id" = a."id" AND a."name" = 'ADMIN_APP';

UPDATE "users"
SET "role_id" = (SELECT id FROM "roles" WHERE slug = 'player')
WHERE "role_id" IS NULL;

ALTER TABLE "users" ALTER COLUMN "role_id" SET NOT NULL;

ALTER TABLE "users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "users_role_id_idx" ON "users"("role_id");

CREATE TYPE "AccountEventType" AS ENUM ('password_reset_required');
CREATE TYPE "AccountEventStatus" AS ENUM ('pending', 'completed', 'cancelled');

CREATE TABLE "user_account_events" (
    "id" SERIAL NOT NULL,
    "type" "AccountEventType" NOT NULL,
    "status" "AccountEventStatus" NOT NULL DEFAULT 'pending',
    "target_user_id" INTEGER NOT NULL,
    "initiated_by_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "user_account_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "user_account_events" ADD CONSTRAINT "user_account_events_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "user_account_events" ADD CONSTRAINT "user_account_events_initiated_by_id_fkey" FOREIGN KEY ("initiated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "user_account_events_target_user_id_status_idx" ON "user_account_events"("target_user_id", "status");
CREATE INDEX "user_account_events_initiated_by_id_idx" ON "user_account_events"("initiated_by_id");
