-- CreateEnum
CREATE TYPE "recurrence_frequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "recurrence_end_date" TIMESTAMP(3),
ADD COLUMN     "recurrence_frequency" "recurrence_frequency",
ADD COLUMN     "recurrence_group_id" UUID;
