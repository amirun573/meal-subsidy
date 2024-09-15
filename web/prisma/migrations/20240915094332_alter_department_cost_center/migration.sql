-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_department_id_fkey";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "cost_center_id" INTEGER;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_department_id_cost_center_id_fkey" FOREIGN KEY ("department_id", "cost_center_id") REFERENCES "DepartmentCostCenter"("department_id", "cost_center_id") ON DELETE CASCADE ON UPDATE CASCADE;
