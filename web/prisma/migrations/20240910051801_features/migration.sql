-- CreateTable
CREATE TABLE "Feature" (
    "feature_id" SERIAL NOT NULL,
    "feature_code" TEXT NOT NULL,
    "feature_name" TEXT NOT NULL,
    "description" TEXT,
    "uuid" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Feature_pkey" PRIMARY KEY ("feature_id")
);

-- CreateTable
CREATE TABLE "UserFeature" (
    "userFeature_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "feature_id" INTEGER NOT NULL,
    "uuid" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "UserFeature_pkey" PRIMARY KEY ("userFeature_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Feature_feature_code_key" ON "Feature"("feature_code");

-- AddForeignKey
ALTER TABLE "UserFeature" ADD CONSTRAINT "UserFeature_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserFeature" ADD CONSTRAINT "UserFeature_feature_id_fkey" FOREIGN KEY ("feature_id") REFERENCES "Feature"("feature_id") ON DELETE CASCADE ON UPDATE CASCADE;
