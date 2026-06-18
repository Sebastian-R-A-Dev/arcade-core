-- Nickname unique per app; users can be deactivated (blocked from login).

ALTER TABLE "users" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "user_profiles" ADD COLUMN "app_id" INTEGER;

UPDATE "user_profiles" up
SET "app_id" = u."app_id"
FROM "users" u
WHERE u."id" = up."user_id";

ALTER TABLE "user_profiles" ALTER COLUMN "app_id" SET NOT NULL;

ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "user_profiles_app_id_nickname_key" ON "user_profiles"("app_id", "nickname");
