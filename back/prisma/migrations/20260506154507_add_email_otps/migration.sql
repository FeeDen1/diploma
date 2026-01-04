-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('email_verification', 'password_reset');

-- CreateTable
CREATE TABLE "email_otps" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_otps_user_id_purpose_used_at_idx" ON "email_otps"("user_id", "purpose", "used_at");

-- AddForeignKey
ALTER TABLE "email_otps"
  ADD CONSTRAINT "email_otps_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
