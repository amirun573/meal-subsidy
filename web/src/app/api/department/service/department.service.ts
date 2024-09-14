import { NextResponse } from "next/server";
import {
  GetDepartmentLists,
  GetEmployeeCategoryLists,
} from "../model/department.model";
import { EmployeeCategory } from "@prisma/client";

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

export async function EmployeeCategoryListsService() {
  let message: string = "";
  let status: number = 500;
  try {
    const employeeCategories: Partial<EmployeeCategory>[] =
      await GetEmployeeCategoryLists({
        where: {},
        select: {
          employee_category_code: true,
          employee_category_name: true,
        },
      });

    return NextResponse.json({
      employeeCategories,
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
