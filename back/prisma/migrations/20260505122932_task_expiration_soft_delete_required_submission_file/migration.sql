-- AlterTable: добавляем поля для срока действия и soft-delete заданий
ALTER TABLE "tasks"
  ADD COLUMN "expires_at" TIMESTAMPTZ,
  ADD COLUMN "archived_at" TIMESTAMPTZ;

-- Индексы для быстрой фильтрации активных/просроченных заданий
CREATE INDEX "tasks_archived_at_idx" ON "tasks"("archived_at");
CREATE INDEX "tasks_expires_at_idx" ON "tasks"("expires_at");

-- Сабмиты без файла теперь невалидны: чистим (если есть) и требуем NOT NULL.
-- Связь с файлом меняем на CASCADE — удаление файла удаляет сабмит.
DELETE FROM "task_submissions" WHERE "submission_file_id" IS NULL;

ALTER TABLE "task_submissions"
  DROP CONSTRAINT "task_submissions_submission_file_id_fkey",
  ALTER COLUMN "submission_file_id" SET NOT NULL,
  ADD CONSTRAINT "task_submissions_submission_file_id_fkey"
    FOREIGN KEY ("submission_file_id") REFERENCES "files"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
