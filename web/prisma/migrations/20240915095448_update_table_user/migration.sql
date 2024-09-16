/*
  Warnings:

  - You are about to drop the column `departmentCostCenterId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `DepartmentCostCenter` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "DepartmentCostCenter" DROP CONSTRAINT "DepartmentCostCenter_cost_center_id_fkey";

-- DropForeignKey
ALTER TABLE "DepartmentCostCenter" DROP CONSTRAINT "DepartmentCostCenter_department_id_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_departmentCostCenterId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "departmentCostCenterId",
ADD COLUMN     "cost_center_id" INTEGER,
ADD COLUMN     "department_id" INTEGER;

-- DropTable
DROP TABLE "DepartmentCostCenter";

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "CostCenter"("cost_center_id") ON DELETE SET NULL ON UPDATE CASCADE;
