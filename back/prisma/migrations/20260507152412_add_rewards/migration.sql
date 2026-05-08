-- AlterEnum
ALTER TYPE "FileType" ADD VALUE 'reward';

-- AlterTable
ALTER TABLE "users" ADD COLUMN "spent_points" INTEGER NOT NULL DEFAULT 0;

-- CreateEnum
CREATE TYPE "RedemptionStatus" AS ENUM ('pending', 'fulfilled', 'cancelled');

-- CreateTable
CREATE TABLE "reward_items" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "price" INTEGER NOT NULL,
    "image_file_id" UUID,
    "archived_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reward_redemptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "reward_item_id" UUID,
    "item_title" VARCHAR(200) NOT NULL,
    "item_price" INTEGER NOT NULL,
    "status" "RedemptionStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reward_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reward_items_image_file_id_key" ON "reward_items"("image_file_id");

-- CreateIndex
CREATE INDEX "reward_items_archived_at_idx" ON "reward_items"("archived_at");

-- CreateIndex
CREATE INDEX "reward_redemptions_user_id_created_at_idx" ON "reward_redemptions"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "reward_items" ADD CONSTRAINT "reward_items_image_file_id_fkey" FOREIGN KEY ("image_file_id") REFERENCES "files"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reward_redemptions" ADD CONSTRAINT "reward_redemptions_reward_item_id_fkey" FOREIGN KEY ("reward_item_id") REFERENCES "reward_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;
