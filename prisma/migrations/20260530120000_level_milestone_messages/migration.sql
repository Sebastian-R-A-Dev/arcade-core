CREATE TABLE "level_milestone_messages" (
    "id" SERIAL NOT NULL,
    "level" INTEGER NOT NULL,
    "message" VARCHAR(512) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "level_milestone_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "level_milestone_messages_level_key" ON "level_milestone_messages"("level");
