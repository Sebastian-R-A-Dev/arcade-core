-- Global question type catalog; questions reference question_type_id.

CREATE TABLE "question_types" (
    "id" SERIAL NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "label" VARCHAR(128) NOT NULL,
    "description" VARCHAR(512),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "question_types_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "question_types_slug_key" ON "question_types"("slug");

ALTER TABLE "questions" DROP COLUMN IF EXISTS "type";

ALTER TABLE "questions" ADD COLUMN "question_type_id" INTEGER NOT NULL;

ALTER TABLE "questions" ADD CONSTRAINT "questions_question_type_id_fkey" FOREIGN KEY ("question_type_id") REFERENCES "question_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "questions_question_type_id_idx" ON "questions"("question_type_id");

DROP TYPE IF EXISTS "QuestionType";
