import { PrismaCondtionFetch } from "@/_Common/interface/database.interface";
import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "../../../../../libs/prisma";
import logger from "../../../../../libs/winston";

export async function GetRoleSingle(data: PrismaCondtionFetch) {
  try {
    const { where, select } = data;

    return prisma.role.findFirst({
      where,
      select,
    });
  } catch (error) {
    logger.error("Failed at GetRoleSingle function ===>", { error });

    console.error(error);
    return null;
  }
}
