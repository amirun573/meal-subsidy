import { User, UserDetails } from "@prisma/client";
import { PrismaCondtionFetch } from "@/_Common/interface/database.interface";
import { prisma } from "../../../../../libs/prisma";


export async function GetUserSingle(
  data: PrismaCondtionFetch
): Promise<Partial<User> | null> {
  try {
    const { where, select } = data;

    return prisma.user.findFirst({
      where,
      select,
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}
