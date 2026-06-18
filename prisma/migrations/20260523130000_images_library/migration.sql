-- AlterTable
ALTER TABLE "questions" ADD COLUMN "image_id" INTEGER;

-- CreateTable
CREATE TABLE "images" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "display_name" VARCHAR(256) NOT NULL,
    "public_url" VARCHAR(2048) NOT NULL,
    "storage_path" VARCHAR(512) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "images_uuid_key" ON "images"("uuid");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "images"("id") ON DELETE SET NULL ON UPDATE CASCADE;
