import { Feature, UserFeatures } from "@prisma/client";
import { PrismaCondtionFetch } from "@/_Common/interface/database.interface";
import { prisma } from "../../../../../libs/prisma";

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
    console.error(error);
    return [];
  }
}
