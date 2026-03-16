-- CreateEnum
CREATE TYPE "subscription_plan" AS ENUM ('BASIC', 'PREMIUM');

-- CreateEnum
CREATE TYPE "shared_access_level" AS ENUM ('READ_ONLY', 'READ_WRITE', 'READ_WRITE_RESTRICTED');

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "plan" "subscription_plan" NOT NULL DEFAULT 'BASIC';

-- CreateTable
CREATE TABLE "shared_persons" (
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
CREATE TABLE "shared_invites" (
    "id" UUID NOT NULL,
    "shared_person_id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shared_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shared_access_logs" (
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
CREATE UNIQUE INDEX "shared_persons_user_id_key" ON "shared_persons"("user_id");

-- CreateIndex
CREATE INDEX "shared_persons_owner_id_idx" ON "shared_persons"("owner_id");

-- CreateIndex
CREATE INDEX "shared_persons_user_id_idx" ON "shared_persons"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "shared_persons_owner_id_email_key" ON "shared_persons"("owner_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "shared_invites_token_key" ON "shared_invites"("token");

-- CreateIndex
CREATE INDEX "shared_invites_token_idx" ON "shared_invites"("token");

-- CreateIndex
CREATE INDEX "shared_invites_expires_at_idx" ON "shared_invites"("expires_at");

-- CreateIndex
CREATE INDEX "shared_access_logs_owner_id_idx" ON "shared_access_logs"("owner_id");

-- CreateIndex
CREATE INDEX "shared_access_logs_shared_person_id_idx" ON "shared_access_logs"("shared_person_id");

-- AddForeignKey
ALTER TABLE "shared_persons" ADD CONSTRAINT "shared_persons_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_persons" ADD CONSTRAINT "shared_persons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_invites" ADD CONSTRAINT "shared_invites_shared_person_id_fkey" FOREIGN KEY ("shared_person_id") REFERENCES "shared_persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shared_access_logs" ADD CONSTRAINT "shared_access_logs_shared_person_id_fkey" FOREIGN KEY ("shared_person_id") REFERENCES "shared_persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
