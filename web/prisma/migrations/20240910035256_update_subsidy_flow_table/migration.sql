/*
  Warnings:

  - You are about to drop the column `username` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[employee_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[department_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `employee_id` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "username",
ADD COLUMN     "department_id" INTEGER,
ADD COLUMN     "employee_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SubsidyType" (
    "subsidy_type_id" SERIAL NOT NULL,
    "subsidy_type_name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "uuid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "SubsidyType_pkey" PRIMARY KEY ("subsidy_type_id")
);

-- CreateTable
CREATE TABLE "Subsidy" (
    "subsidy_id" SERIAL NOT NULL,
    "subsidy_type_id" INTEGER NOT NULL,
    "applicable" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "uuid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "Subsidy_pkey" PRIMARY KEY ("subsidy_id")
);

-- CreateTable
CREATE TABLE "SubsidyCredit" (
    "subsidy_credit_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "subsidy_id" INTEGER NOT NULL,
    "credit_amount" DOUBLE PRECISION NOT NULL,
    "credited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "uuid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "SubsidyCredit_pkey" PRIMARY KEY ("subsidy_credit_id")
);

-- CreateTable
CREATE TABLE "SubsidyTransaction" (
    "transaction_id" SERIAL NOT NULL,
    "subsidy_credit_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "transaction_type" "TransactionType" NOT NULL DEFAULT 'DEBIT',
    "amount" DOUBLE PRECISION NOT NULL,
    "transaction_status" "TransactionStatus" NOT NULL DEFAULT 'FAILED',
    "transaction_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "uuid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "SubsidyTransaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateTable
CREATE TABLE "Department" (
    "department_id" SERIAL NOT NULL,
    "department_code" TEXT NOT NULL,
    "department_name" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "uuid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Department_pkey" PRIMARY KEY ("department_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubsidyType_subsidy_type_name_key" ON "SubsidyType"("subsidy_type_name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_department_code_key" ON "Department"("department_code");

-- CreateIndex
CREATE UNIQUE INDEX "User_employee_id_key" ON "User"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_department_id_key" ON "User"("department_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("department_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subsidy" ADD CONSTRAINT "Subsidy_subsidy_type_id_fkey" FOREIGN KEY ("subsidy_type_id") REFERENCES "SubsidyType"("subsidy_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subsidy" ADD CONSTRAINT "Subsidy_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubsidyCredit" ADD CONSTRAINT "SubsidyCredit_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubsidyCredit" ADD CONSTRAINT "SubsidyCredit_subsidy_id_fkey" FOREIGN KEY ("subsidy_id") REFERENCES "Subsidy"("subsidy_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubsidyTransaction" ADD CONSTRAINT "SubsidyTransaction_subsidy_credit_id_fkey" FOREIGN KEY ("subsidy_credit_id") REFERENCES "SubsidyCredit"("subsidy_credit_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubsidyTransaction" ADD CONSTRAINT "SubsidyTransaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
