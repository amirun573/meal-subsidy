import { NextResponse } from "next/server";
import { GetDepartmentLists } from "../model/department.model";

export async function DepartmentLists() {
  let message: string = "";
  let status: number = 500;
  try {
    const departments = await GetDepartmentLists({
      where: {},
      select: {
        department_code: true,
        department_name: true,
        uuid: true,
      },
    });

    return NextResponse.json({
      departments,
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
