CREATE TABLE "ApplicationLog" (
    "id" SERIAL NOT NULL,
    "level" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "detail" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ApplicationLog_created_at_id_idx" ON "ApplicationLog"("created_at", "id");
