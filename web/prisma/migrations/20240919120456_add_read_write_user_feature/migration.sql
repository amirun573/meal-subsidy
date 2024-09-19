-- AlterTable
ALTER TABLE "UserFeatures" ADD COLUMN     "is_read" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "is_write" BOOLEAN NOT NULL DEFAULT true;
