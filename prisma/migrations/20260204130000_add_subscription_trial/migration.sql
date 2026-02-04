-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN "is_trial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "subscriptions" ADD COLUMN "trial_ends_at" TIMESTAMP(3);
