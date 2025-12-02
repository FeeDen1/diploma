-- Эта миграция приводит историю миграций в соответствие с фактической схемой:
-- ранее таблица files и связи avatar_file_id / task_file_id / submission_file_id
-- были добавлены вне миграций (через db push или вручную). Поэтому SQL идемпотентный —
-- на боевой БД где таблицы уже есть он ничего не изменит, а на shadow DB создаст их.

-- CreateEnum: FileType
DO $$ BEGIN
    CREATE TYPE "FileType" AS ENUM ('avatar', 'task', 'submission');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateEnum: FileVisibility
DO $$ BEGIN
    CREATE TYPE "FileVisibility" AS ENUM ('public', 'private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: files
CREATE TABLE IF NOT EXISTS "files" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "bucket" VARCHAR(100) NOT NULL,
    "object_key" VARCHAR(500) NOT NULL,
    "visibility" "FileVisibility" NOT NULL DEFAULT 'public',
    "mime_type" VARCHAR(100) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "type" "FileType" NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- AddColumn: users.avatar_file_id
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "avatar_file_id" UUID;
CREATE UNIQUE INDEX IF NOT EXISTS "users_avatar_file_id_key" ON "users"("avatar_file_id");

-- AddColumn: tasks.task_file_id
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "task_file_id" UUID;
CREATE UNIQUE INDEX IF NOT EXISTS "tasks_task_file_id_key" ON "tasks"("task_file_id");

-- AddColumn: task_submissions.submission_file_id (на этом этапе nullable; NOT NULL поставит следующая миграция)
ALTER TABLE "task_submissions" ADD COLUMN IF NOT EXISTS "submission_file_id" UUID;
CREATE UNIQUE INDEX IF NOT EXISTS "task_submissions_submission_file_id_key" ON "task_submissions"("submission_file_id");

-- AddForeignKey: files.owner_user_id -> users.id
DO $$ BEGIN
    ALTER TABLE "files" ADD CONSTRAINT "files_owner_user_id_fkey"
        FOREIGN KEY ("owner_user_id") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: users.avatar_file_id -> files.id
DO $$ BEGIN
    ALTER TABLE "users" ADD CONSTRAINT "users_avatar_file_id_fkey"
        FOREIGN KEY ("avatar_file_id") REFERENCES "files"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: tasks.task_file_id -> files.id
DO $$ BEGIN
    ALTER TABLE "tasks" ADD CONSTRAINT "tasks_task_file_id_fkey"
        FOREIGN KEY ("task_file_id") REFERENCES "files"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: task_submissions.submission_file_id -> files.id (на этом этапе SET NULL; следующая миграция поменяет на CASCADE)
DO $$ BEGIN
    ALTER TABLE "task_submissions" ADD CONSTRAINT "task_submissions_submission_file_id_fkey"
        FOREIGN KEY ("submission_file_id") REFERENCES "files"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
