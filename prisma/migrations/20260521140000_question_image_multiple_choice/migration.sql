-- AlterEnum
ALTER TYPE "QuestionType" ADD VALUE 'image_multiple_choice';

-- AlterTable
ALTER TABLE "questions" ADD COLUMN "image_url" VARCHAR(2048);
