import { Prisma, EmployeeCategory, CostCenter } from "@prisma/client";
import { prisma } from "../../../../../libs/prisma";
import { PrismaCondtionFetch } from "@/_Common/interface/database.interface";

export async function GetDepartmentLists(data: PrismaCondtionFetch) {
  try {
    const { where, select } = data;

    return prisma.department.findMany({
      where,
      select,
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function GetDepartmentSingle(data: PrismaCondtionFetch) {
  try {
    const { where, select } = data;

    return prisma.department.findFirst({
      where,
      select,
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function GetEmployeeCategoryLists(data: PrismaCondtionFetch) {
  try {
    const { where, select } = data;

    return prisma.employeeCategory.findMany({
      where,
      select,
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function GetEmployeeCategorySingle(data: PrismaCondtionFetch) {
  try {
    const { where, select } = data;

    return prisma.employeeCategory.findFirst({
      where,
      select,
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function GetCostCenterLists(data: PrismaCondtionFetch) {
  try {
    const { where, select } = data;

    return prisma.costCenter.findMany({
      where,
      select,
    });
  } catch (error) {
    console.error(error);
    return [];
  }
}
