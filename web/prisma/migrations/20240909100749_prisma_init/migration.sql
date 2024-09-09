-- CreateTable
CREATE TABLE "Role" (
    "role_id" SERIAL NOT NULL,
    "role_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "uuid" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Role_pkey" PRIMARY KEY ("role_id")
);

-- CreateTable
CREATE TABLE "User" (
    "user_id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "uuid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "role_id" INTEGER,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "email_verification_token" TEXT,
    "deleted_at" TIMESTAMP(3),
    "is_acc_verify" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "Country" (
    "country_id" SERIAL NOT NULL,
    "country_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region_id" INTEGER NOT NULL,
    "currency" TEXT,
    "currency_code" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "uuid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "country_phone_code" TEXT,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Country_pkey" PRIMARY KEY ("country_id")
);

-- CreateTable
CREATE TABLE "User_Details" (
    "user_details_id" SERIAL NOT NULL,
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

    CONSTRAINT "User_Details_pkey" PRIMARY KEY ("user_details_id")
);

-- CreateTable
CREATE TABLE "Region" (
    "region_id" SERIAL NOT NULL,
    "region_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "uuid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Region_pkey" PRIMARY KEY ("region_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_role_code_key" ON "Role"("role_code");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Country_country_code_key" ON "Country"("country_code");

-- CreateIndex
CREATE UNIQUE INDEX "User_Details_user_id_key" ON "User_Details"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Region_region_code_key" ON "Region"("region_code");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("role_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Country" ADD CONSTRAINT "Country_region_id_fkey" FOREIGN KEY ("region_id") REFERENCES "Region"("region_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Details" ADD CONSTRAINT "User_Details_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_Details" ADD CONSTRAINT "User_Details_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "Country"("country_id") ON DELETE CASCADE ON UPDATE CASCADE;
