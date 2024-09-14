import { Prisma } from "@prisma/client";
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
