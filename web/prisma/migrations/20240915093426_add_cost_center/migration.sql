-- CreateTable
CREATE TABLE "CostCenter" (
    "cost_center_id" SERIAL NOT NULL,
    "cost_center_code" TEXT NOT NULL,
    "cost_center_description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "uuid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("cost_center_id")
);

-- CreateTable
CREATE TABLE "DepartmentCostCenter" (
    "department_id" INTEGER NOT NULL,
    "cost_center_id" INTEGER NOT NULL,
    "allocation" DOUBLE PRECISION,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "uuid" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "DepartmentCostCenter_pkey" PRIMARY KEY ("department_id","cost_center_id")
);

-- AddForeignKey
ALTER TABLE "DepartmentCostCenter" ADD CONSTRAINT "DepartmentCostCenter_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("department_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentCostCenter" ADD CONSTRAINT "DepartmentCostCenter_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "CostCenter"("cost_center_id") ON DELETE RESTRICT ON UPDATE CASCADE;
