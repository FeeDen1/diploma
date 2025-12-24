-- CreateEnum: Direction
CREATE TYPE "Direction" AS ENUM ('pmi', 'piit', 'bd', 'pkt');

-- CreateEnum: TaskCategory
CREATE TYPE "TaskCategory" AS ENUM ('socialization', 'adaptation', 'self_realization');

-- AlterTable: groups
-- name становится UNIQUE (формат "26.Б03-ПУ" — натуральный естественный ключ)
-- direction обязательное; для существующих строк (если есть) проставим временно 'pmi',
-- админ потом сможет поправить. После добавления делаем NOT NULL.
ALTER TABLE "groups" ADD COLUMN "direction" "Direction";
UPDATE "groups" SET "direction" = 'pmi' WHERE "direction" IS NULL;
ALTER TABLE "groups" ALTER COLUMN "direction" SET NOT NULL;

-- Уникальность имени и индекс по direction
CREATE UNIQUE INDEX "groups_name_key" ON "groups"("name");
CREATE INDEX "groups_direction_idx" ON "groups"("direction");

-- AlterTable: tasks — обязательная category
-- Добавляем nullable, бэкфилл в 'self_realization' для существующих, потом NOT NULL
ALTER TABLE "tasks" ADD COLUMN "category" "TaskCategory";
UPDATE "tasks" SET "category" = 'self_realization' WHERE "category" IS NULL;
ALTER TABLE "tasks" ALTER COLUMN "category" SET NOT NULL;

CREATE INDEX "tasks_category_idx" ON "tasks"("category");
