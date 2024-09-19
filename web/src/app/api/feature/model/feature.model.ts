import { Feature, UserFeatures } from "@prisma/client";
import { PrismaCondtionFetch } from "@/_Common/interface/database.interface";
import { prisma } from "../../../../../libs/prisma";
import logger from "../../../../../libs/winston";

export async function GetUserFeatures(
  data: PrismaCondtionFetch
): Promise<Partial<UserFeatures>[]> {
  try {
    const { where, select } = data;

    return prisma.userFeatures.findMany({
      where,
      select,
    });
  } catch (error) {
    logger.error("Failed at GetUserFeatures function ===>", { error });

    console.error(error);
    return [];
  }
}
