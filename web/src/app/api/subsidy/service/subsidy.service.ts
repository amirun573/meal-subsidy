import { SubsidyEmployeeUpdate } from "@/_Common/interface/subsidy.interface";
import { EmployeeUpdateSubsidyValidation } from "@/_Common/validation/subsidy.validation";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export async function UpdateUserApplicableSubsidy(data: SubsidyEmployeeUpdate) {
  let message: string = "";
  let status: number = 500;
  try {
    await EmployeeUpdateSubsidyValidation(data);

    const { uuid, applicable, code, subsidy_uuid } = data;

    return NextResponse.json({
      message: "",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || message,
      },
      {
        status: error.statusCode || status,
      }
    );
  }
}
