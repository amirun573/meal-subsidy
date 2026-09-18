-- CreateEnum
CREATE TYPE "ScheduleType" AS ENUM ('ROUTINE', 'RANGE');

-- CreateEnum
CREATE TYPE "RoutineFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateEnum
CREATE TYPE "ScheduleTriggerSource" AS ENUM ('CRON', 'MANUAL');

-- CreateTable
CREATE TABLE "SubsidySchedule" (
    "subsidy_schedule_id" SERIAL NOT NULL,
    "uuid" TEXT,
    "title" TEXT NOT NULL,
    "schedule_type" "ScheduleType" NOT NULL,
    "routine_frequency" "RoutineFrequency",
    "cron_expression" TEXT,
    "trigger_time" TEXT,
    "day_of_week" INTEGER,
    "day_of_month" INTEGER,
    "start_datetime" TIMESTAMP(3),
    "end_datetime" TIMESTAMP(3),
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subsidy_type_id" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "SubsidySchedule_pkey" PRIMARY KEY ("subsidy_schedule_id")
);

-- CreateTable
CREATE TABLE "SubsidyScheduleLog" (
    "subsidy_schedule_log_id" SERIAL NOT NULL,
    "uuid" TEXT,
    "subsidy_schedule_id" INTEGER,
    "triggered_by_source" "ScheduleTriggerSource" NOT NULL DEFAULT 'CRON',
    "triggered_by_user_id" INTEGER,
    "triggered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL,
    "users_affected_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubsidyScheduleLog_pkey" PRIMARY KEY ("subsidy_schedule_log_id")
);

-- AddForeignKey
ALTER TABLE "SubsidySchedule" ADD CONSTRAINT "SubsidySchedule_subsidy_type_id_fkey" FOREIGN KEY ("subsidy_type_id") REFERENCES "SubsidyType"("subsidy_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubsidyScheduleLog" ADD CONSTRAINT "SubsidyScheduleLog_subsidy_schedule_id_fkey" FOREIGN KEY ("subsidy_schedule_id") REFERENCES "SubsidySchedule"("subsidy_schedule_id") ON DELETE SET NULL ON UPDATE CASCADE;
