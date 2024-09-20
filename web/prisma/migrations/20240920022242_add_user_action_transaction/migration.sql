-- AlterTable
ALTER TABLE "SubsidyTransaction" ADD COLUMN     "created_by_user_id" INTEGER,
ADD COLUMN     "deleted_by_user_id" INTEGER,
ADD COLUMN     "updated_by_user_id" INTEGER;

-- AddForeignKey
ALTER TABLE "SubsidyTransaction" ADD CONSTRAINT "SubsidyTransaction_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubsidyTransaction" ADD CONSTRAINT "SubsidyTransaction_updated_by_user_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubsidyTransaction" ADD CONSTRAINT "SubsidyTransaction_deleted_by_user_id_fkey" FOREIGN KEY ("deleted_by_user_id") REFERENCES "User"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;
