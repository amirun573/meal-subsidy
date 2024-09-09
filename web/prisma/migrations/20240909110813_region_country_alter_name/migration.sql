/*
  Warnings:

  - You are about to drop the column `name` on the `Country` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Region` table. All the data in the column will be lost.
  - Added the required column `country_name` to the `Country` table without a default value. This is not possible if the table is not empty.
  - Added the required column `region_name` to the `Region` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Country" DROP COLUMN "name",
ADD COLUMN     "country_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Region" DROP COLUMN "name",
ADD COLUMN     "region_name" TEXT NOT NULL;
