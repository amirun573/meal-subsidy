/*
  Warnings:

  - You are about to drop the column `amount` on the `SubsidyTransaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SubsidyTransaction" DROP COLUMN "amount",
ADD COLUMN     "credit_used" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "discount_price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "total_price" DOUBLE PRECISION NOT NULL DEFAULT 0;
