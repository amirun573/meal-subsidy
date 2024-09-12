/*
  Warnings:

  - A unique constraint covering the columns `[subsidy_type_code]` on the table `SubsidyType` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "SubsidyType_subsidy_type_name_key";

-- AlterTable
ALTER TABLE "SubsidyType" ADD COLUMN     "subsidy_type_code" TEXT NOT NULL DEFAULT 'meal';

-- CreateIndex
CREATE UNIQUE INDEX "SubsidyType_subsidy_type_code_key" ON "SubsidyType"("subsidy_type_code");
