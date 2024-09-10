/*
  Warnings:

  - You are about to drop the `User_Details` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "User_Details" DROP CONSTRAINT "User_Details_country_id_fkey";

-- DropForeignKey
ALTER TABLE "User_Details" DROP CONSTRAINT "User_Details_user_id_fkey";

-- DropTable
DROP TABLE "User_Details";

-- CreateTable
CREATE TABLE "UserDetails" (
    "UserDetails_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "mobile_phone" TEXT,
    "img_profile" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "uuid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "country_id" INTEGER,
    "privacy_policy_term_condition" BOOLEAN NOT NULL DEFAULT false,
    "deleted_at" TIMESTAMP(3),
    "id_number" TEXT,
    "id_image" TEXT,

    CONSTRAINT "UserDetails_pkey" PRIMARY KEY ("UserDetails_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserDetails_user_id_key" ON "UserDetails"("user_id");

-- AddForeignKey
ALTER TABLE "UserDetails" ADD CONSTRAINT "UserDetails_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserDetails" ADD CONSTRAINT "UserDetails_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "Country"("country_id") ON DELETE CASCADE ON UPDATE CASCADE;
