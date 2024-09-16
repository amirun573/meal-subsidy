/*
  Warnings:

  - A unique constraint covering the columns `[cost_center_code]` on the table `CostCenter` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CostCenter_cost_center_code_key" ON "CostCenter"("cost_center_code");
