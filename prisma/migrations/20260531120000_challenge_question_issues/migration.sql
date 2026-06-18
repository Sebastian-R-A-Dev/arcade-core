-- CreateTable
CREATE TABLE "challenge_question_issues" (
    "id" SERIAL NOT NULL,
    "session_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "difficulty_id" INTEGER NOT NULL,
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "answered_at" TIMESTAMP(3),

    CONSTRAINT "challenge_question_issues_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "challenge_question_issues_session_id_question_id_key" ON "challenge_question_issues"("session_id", "question_id");

-- CreateIndex
CREATE INDEX "challenge_question_issues_session_id_answered_at_idx" ON "challenge_question_issues"("session_id", "answered_at");

-- AddForeignKey
ALTER TABLE "challenge_question_issues" ADD CONSTRAINT "challenge_question_issues_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
