-- CreateEnum (subscription_plan may already exist from previous run)
DO $$ BEGIN
  CREATE TYPE "subscription_plan" AS ENUM ('BASIC', 'PREMIUM');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum (shared_access_level may already exist from previous run)
DO $$ BEGIN
  CREATE TYPE "shared_access_level" AS ENUM ('READ_ONLY', 'READ_WRITE', 'READ_WRITE_RESTRICTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable (plan column may already exist)
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "plan" "subscription_plan" NOT NULL DEFAULT 'BASIC';

-- CreateTable
CREATE TABLE IF NOT EXISTS "shared_persons" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "user_id" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "access_level" "shared_access_level" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "shared_invites" (
    "id" UUID NOT NULL,
    "shared_person_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "shared_access_logs" (
    "id" UUID NOT NULL,
    "shared_person_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "access_level" "shared_access_level" NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "shared_persons_user_id_key" ON "shared_persons"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "shared_persons_owner_id_email_key" ON "shared_persons"("owner_id", "email");
CREATE INDEX IF NOT EXISTS "shared_persons_owner_id_idx" ON "shared_persons"("owner_id");
CREATE INDEX IF NOT EXISTS "shared_persons_user_id_idx" ON "shared_persons"("user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "shared_invites_token_key" ON "shared_invites"("token");
CREATE INDEX IF NOT EXISTS "shared_invites_token_idx" ON "shared_invites"("token");
CREATE INDEX IF NOT EXISTS "shared_invites_expires_at_idx" ON "shared_invites"("expires_at");
CREATE INDEX IF NOT EXISTS "shared_access_logs_owner_id_idx" ON "shared_access_logs"("owner_id");
CREATE INDEX IF NOT EXISTS "shared_access_logs_shared_person_id_idx" ON "shared_access_logs"("shared_person_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "shared_persons" ADD CONSTRAINT "shared_persons_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "shared_persons" ADD CONSTRAINT "shared_persons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "shared_invites" ADD CONSTRAINT "shared_invites_shared_person_id_fkey" FOREIGN KEY ("shared_person_id") REFERENCES "shared_persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN
  ALTER TABLE "shared_access_logs" ADD CONSTRAINT "shared_access_logs_shared_person_id_fkey" FOREIGN KEY ("shared_person_id") REFERENCES "shared_persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
