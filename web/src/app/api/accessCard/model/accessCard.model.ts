import { Prisma, AccessCard } from "@prisma/client";
import { prisma } from "../../../../../libs/prisma";

export async function CreateAccessCard(object: {
  data: AccessCard;
  prismaTransaction?: any;
}): Promise<AccessCard | null> {
  try {
    const { data, prismaTransaction } = object;

    if (!prismaTransaction) {
      return prisma.accessCard.create({
        data,
      });
    } else {
      return prismaTransaction.accessCard.create({
        data,
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function CreateAccessCardMany(object: {
  data: AccessCard[];
  prismaTransaction?: any;
}): Promise<AccessCard[]> {
  try {
    const { data, prismaTransaction } = object;

    if (!prismaTransaction) {
      return prisma.accessCard.createManyAndReturn({
        data,
        skipDuplicates: true,
      });
    } else {
      return prismaTransaction.accessCard.createManyAndReturn({
        data,
        skipDuplicates: true,
      });
    }
  } catch (error) {
    console.error(error);
    return [];
  }
}
