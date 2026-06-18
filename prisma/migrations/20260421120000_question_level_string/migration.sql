-- Question.level: free-form string per app (replaces CefrLevel enum on this column)
ALTER TABLE "questions" ALTER COLUMN "level" DROP DEFAULT;
ALTER TABLE "questions" ALTER COLUMN "level" TYPE TEXT USING ("level"::text);

DROP TYPE "CefrLevel";
