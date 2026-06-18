-- Image kind (generic | avatar); profile links to avatar catalog.

CREATE TYPE "ImageKind" AS ENUM ('generic', 'avatar');

ALTER TABLE "images" ADD COLUMN "kind" "ImageKind" NOT NULL DEFAULT 'generic';

CREATE INDEX "images_kind_created_at_idx" ON "images"("kind", "created_at" DESC);

ALTER TABLE "user_profiles" ADD COLUMN "avatar_image_id" INTEGER;

ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_avatar_image_id_fkey" FOREIGN KEY ("avatar_image_id") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "user_profiles_avatar_image_id_idx" ON "user_profiles"("avatar_image_id");
