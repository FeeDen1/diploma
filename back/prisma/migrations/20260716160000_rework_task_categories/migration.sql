-- Смена набора категорий заданий.
--
-- Было:  socialization | adaptation | self_realization
-- Стало: study | sport | outdoor | teambuilding | activism
--
-- Осмысленного маппинга старых значений в новые нет (3 → 5, смысл пересекается
-- лишь частично), поэтому все существующие задания переводим в 'teambuilding'
-- (сплочение) — админ переназначит категории вручную через админку.
--
-- Postgres не умеет удалять значения из enum, поэтому классический приём:
-- создаём новый тип, переливаем колонку, старый тип удаляем.

-- 1. Новый enum
CREATE TYPE "TaskCategory_new" AS ENUM ('study', 'sport', 'outdoor', 'teambuilding', 'activism');

-- 2. Переливаем колонку: любое старое значение → 'teambuilding'.
--    USING игнорирует прежнее значение и подставляет константу.
ALTER TABLE "tasks"
  ALTER COLUMN "category" TYPE "TaskCategory_new"
  USING ('teambuilding'::"TaskCategory_new");

-- 3. Меняем типы местами
ALTER TYPE "TaskCategory" RENAME TO "TaskCategory_old";
ALTER TYPE "TaskCategory_new" RENAME TO "TaskCategory";
DROP TYPE "TaskCategory_old";
