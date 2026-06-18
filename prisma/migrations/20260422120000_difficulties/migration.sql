-- Difficulties per app; questions reference difficulty_id instead of free-text level.

CREATE TABLE "difficulties" (
    "id" SERIAL NOT NULL,
    "app_id" INTEGER NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "difficulties_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "difficulties_app_id_name_key" ON "difficulties"("app_id", "name");
CREATE INDEX "difficulties_app_id_idx" ON "difficulties"("app_id");

ALTER TABLE "difficulties" ADD CONSTRAINT "difficulties_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

DROP INDEX IF EXISTS "questions_app_id_level_idx";

ALTER TABLE "questions" DROP COLUMN IF EXISTS "level";

ALTER TABLE "questions" ADD COLUMN "difficulty_id" INTEGER NOT NULL;

ALTER TABLE "questions" ADD CONSTRAINT "questions_difficulty_id_fkey" FOREIGN KEY ("difficulty_id") REFERENCES "difficulties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "questions_app_id_difficulty_id_idx" ON "questions"("app_id", "difficulty_id");
