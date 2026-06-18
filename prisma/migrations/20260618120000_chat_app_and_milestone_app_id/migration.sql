-- AppType.chat for CHAT-BOX
DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'AppType'
      AND e.enumlabel = 'chat'
  ) THEN
    ALTER TYPE "AppType" ADD VALUE 'chat';
  END IF;
END$migration$;

-- level_milestone_messages: scope by app_id
ALTER TABLE "level_milestone_messages" ADD COLUMN IF NOT EXISTS "app_id" INTEGER;

UPDATE "level_milestone_messages" lm
SET "app_id" = a.id
FROM "apps" a
WHERE lm."app_id" IS NULL
  AND a."name" = 'ENGLISH-CHALLENGE';

UPDATE "level_milestone_messages" lm
SET "app_id" = a.id
FROM "apps" a
WHERE lm."app_id" IS NULL
  AND a."name" = 'ADMIN_APP';

UPDATE "level_milestone_messages" lm
SET "app_id" = sub.id
FROM (SELECT MIN(id) AS id FROM "apps") sub
WHERE lm."app_id" IS NULL;

ALTER TABLE "level_milestone_messages" ALTER COLUMN "app_id" SET NOT NULL;

DROP INDEX IF EXISTS "level_milestone_messages_level_key";

CREATE UNIQUE INDEX IF NOT EXISTS "level_milestone_messages_app_id_level_key"
  ON "level_milestone_messages"("app_id", "level");

CREATE INDEX IF NOT EXISTS "level_milestone_messages_app_id_idx"
  ON "level_milestone_messages"("app_id");

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'level_milestone_messages_app_id_fkey'
  ) THEN
    ALTER TABLE "level_milestone_messages"
      ADD CONSTRAINT "level_milestone_messages_app_id_fkey"
      FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$migration$;

-- Private chat persistence
CREATE TABLE IF NOT EXISTS "chat_private_conversations" (
    "id" SERIAL NOT NULL,
    "app_id" INTEGER NOT NULL,
    "user_low_id" INTEGER NOT NULL,
    "user_high_id" INTEGER NOT NULL,
    "messages_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_private_conversations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "chat_private_conversations_app_id_user_low_id_user_high_id_key"
  ON "chat_private_conversations"("app_id", "user_low_id", "user_high_id");

CREATE INDEX IF NOT EXISTS "chat_private_conversations_app_id_user_low_id_idx"
  ON "chat_private_conversations"("app_id", "user_low_id");

CREATE INDEX IF NOT EXISTS "chat_private_conversations_app_id_user_high_id_idx"
  ON "chat_private_conversations"("app_id", "user_high_id");

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_private_conversations_app_id_fkey'
  ) THEN
    ALTER TABLE "chat_private_conversations"
      ADD CONSTRAINT "chat_private_conversations_app_id_fkey"
      FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_private_conversations_user_low_id_fkey'
  ) THEN
    ALTER TABLE "chat_private_conversations"
      ADD CONSTRAINT "chat_private_conversations_user_low_id_fkey"
      FOREIGN KEY ("user_low_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chat_private_conversations_user_high_id_fkey'
  ) THEN
    ALTER TABLE "chat_private_conversations"
      ADD CONSTRAINT "chat_private_conversations_user_high_id_fkey"
      FOREIGN KEY ("user_high_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END$migration$;
