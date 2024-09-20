/*
  Warnings:

  - You are about to drop the column `Amount` on the `Subsidy` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Subsidy" DROP COLUMN "Amount",
ADD COLUMN     "amount" DOUBLE PRECISION NOT NULL DEFAULT 0;
