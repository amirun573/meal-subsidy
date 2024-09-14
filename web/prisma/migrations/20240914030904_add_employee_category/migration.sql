/*
  Warnings:

  - A unique constraint covering the columns `[employee_category_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "employee_category_id" INTEGER;

-- CreateTable
CREATE TABLE "EmployeeCategory" (
    "employee_category_id" SERIAL NOT NULL,
    "employee_category_code" TEXT NOT NULL,
    "employee_category_name" TEXT NOT NULL,
    "uuid" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "EmployeeCategory_pkey" PRIMARY KEY ("employee_category_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmployeeCategory_employee_category_code_key" ON "EmployeeCategory"("employee_category_code");

-- CreateIndex
CREATE UNIQUE INDEX "User_employee_category_id_key" ON "User"("employee_category_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_employee_category_id_fkey" FOREIGN KEY ("employee_category_id") REFERENCES "EmployeeCategory"("employee_category_id") ON DELETE CASCADE ON UPDATE CASCADE;
