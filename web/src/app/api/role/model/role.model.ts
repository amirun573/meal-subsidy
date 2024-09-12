import { PrismaCondtionFetch } from "@/_Common/interface/database.interface";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../../../../libs/prisma";

export async function GetRoleSingle(data: PrismaCondtionFetch) {
  try {
    const { where, select } = data;

    return prisma.role.findFirst({
      where,
      select,
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}
