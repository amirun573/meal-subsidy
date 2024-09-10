/*
  Warnings:

  - You are about to drop the `UserFeature` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserFeature" DROP CONSTRAINT "UserFeature_feature_id_fkey";

-- DropForeignKey
ALTER TABLE "UserFeature" DROP CONSTRAINT "UserFeature_user_id_fkey";

-- DropTable
DROP TABLE "UserFeature";

-- CreateTable
CREATE TABLE "UserFeatures" (
    "UserFeatures_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "feature_id" INTEGER NOT NULL,
    "uuid" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "UserFeatures_pkey" PRIMARY KEY ("UserFeatures_id")
);

-- AddForeignKey
ALTER TABLE "UserFeatures" ADD CONSTRAINT "UserFeatures_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeatures" ADD CONSTRAINT "UserFeatures_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "Feature"("feature_id") ON DELETE CASCADE ON UPDATE CASCADE;
