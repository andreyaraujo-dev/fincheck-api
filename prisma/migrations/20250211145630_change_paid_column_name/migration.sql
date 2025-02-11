/*
  Warnings:

  - You are about to drop the column `isPaid` on the `transactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "isPaid",
ADD COLUMN     "is_paid" BOOLEAN DEFAULT false;
