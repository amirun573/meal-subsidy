/*
  Warnings:

  - The primary key for the `DepartmentCostCenter` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `cost_center_id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `department_id` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[department_id,cost_center_id]` on the table `DepartmentCostCenter` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_department_id_cost_center_id_fkey";

-- AlterTable
ALTER TABLE "DepartmentCostCenter" DROP CONSTRAINT "DepartmentCostCenter_pkey",
ADD COLUMN     "department_cost_center_id" SERIAL NOT NULL,
ADD CONSTRAINT "DepartmentCostCenter_pkey" PRIMARY KEY ("department_cost_center_id");

-- AlterTable
ALTER TABLE "User" DROP COLUMN "cost_center_id",
DROP COLUMN "department_id",
ADD COLUMN     "departmentCostCenterId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "DepartmentCostCenter_department_id_cost_center_id_key" ON "DepartmentCostCenter"("department_id", "cost_center_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_departmentCostCenterId_fkey" FOREIGN KEY ("departmentCostCenterId") REFERENCES "DepartmentCostCenter"("department_cost_center_id") ON DELETE CASCADE ON UPDATE CASCADE;
