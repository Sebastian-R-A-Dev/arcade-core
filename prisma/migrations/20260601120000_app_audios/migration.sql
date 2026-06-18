-- CreateTable
CREATE TABLE "app_audios" (
    "id" SERIAL NOT NULL,
    "uuid" UUID NOT NULL,
    "display_name" VARCHAR(256) NOT NULL,
    "public_url" VARCHAR(2048) NOT NULL,
    "storage_path" VARCHAR(512) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_audios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_audios_uuid_key" ON "app_audios"("uuid");

-- CreateIndex
CREATE INDEX "app_audios_created_at_idx" ON "app_audios"("created_at");
