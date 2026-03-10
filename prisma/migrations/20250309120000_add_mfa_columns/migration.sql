-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mfa_secret" TEXT;
