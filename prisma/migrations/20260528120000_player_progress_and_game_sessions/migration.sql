-- Player progression and challenge game sessions.

CREATE TYPE "GameSessionStatus" AS ENUM ('active', 'completed', 'failed');

CREATE TABLE "user_progress" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 0,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "games_played" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_progress_user_id_key" ON "user_progress"("user_id");

ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "user_progress" ("user_id", "level", "xp", "games_played", "updated_at")
SELECT u."id", 0, 0, 0, CURRENT_TIMESTAMP
FROM "users" u
WHERE NOT EXISTS (SELECT 1 FROM "user_progress" p WHERE p."user_id" = u."id");

CREATE TABLE "game_sessions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "app_id" INTEGER NOT NULL,
    "status" "GameSessionStatus" NOT NULL DEFAULT 'active',
    "total_questions" INTEGER NOT NULL,
    "correct_count" INTEGER NOT NULL DEFAULT 0,
    "xp_earned" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "game_sessions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "game_sessions_user_id_app_id_idx" ON "game_sessions"("user_id", "app_id");
CREATE INDEX "game_sessions_status_idx" ON "game_sessions"("status");

CREATE TABLE "challenge_answer_attempts" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "is_correct" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "challenge_answer_attempts_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "challenge_answer_attempts" ADD CONSTRAINT "challenge_answer_attempts_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "challenge_answer_attempts_session_id_question_id_idx" ON "challenge_answer_attempts"("session_id", "question_id");
