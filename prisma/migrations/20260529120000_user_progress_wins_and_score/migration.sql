-- Leaderboard: wins (perfect runs) and cumulative competitive score.
ALTER TABLE "user_progress" ADD COLUMN "wins" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "user_progress" ADD COLUMN "total_score" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "user_progress" ADD COLUMN "bonus_xp_total" INTEGER NOT NULL DEFAULT 0;

CREATE INDEX "user_progress_wins_total_score_idx" ON "user_progress"("wins" DESC, "total_score" DESC);
