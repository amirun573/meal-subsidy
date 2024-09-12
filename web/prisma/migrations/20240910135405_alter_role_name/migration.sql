/*
  Warnings:

  - You are about to drop the column `name` on the `Role` table. All the data in the column will be lost.
  - Added the required column `role_name` to the `Role` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Role" DROP COLUMN "name",
ADD COLUMN     "role_name" TEXT NOT NULL;
