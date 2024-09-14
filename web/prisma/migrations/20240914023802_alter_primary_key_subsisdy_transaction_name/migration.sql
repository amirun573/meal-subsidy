/*
  Warnings:

  - The primary key for the `SubsidyTransaction` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `transaction_id` on the `SubsidyTransaction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SubsidyTransaction" DROP CONSTRAINT "SubsidyTransaction_pkey",
DROP COLUMN "transaction_id",
ADD COLUMN     "subsidy_transaction_id" SERIAL NOT NULL,
ADD CONSTRAINT "SubsidyTransaction_pkey" PRIMARY KEY ("subsidy_transaction_id");
