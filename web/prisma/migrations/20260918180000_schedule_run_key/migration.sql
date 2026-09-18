-- A nullable unique key makes automated credit runs idempotent across processes.
-- Existing manual and historical log rows remain valid with a NULL key.
ALTER TABLE "SubsidyScheduleLog" ADD COLUMN "run_key" TEXT;
CREATE UNIQUE INDEX "SubsidyScheduleLog_run_key_key" ON "SubsidyScheduleLog"("run_key");
