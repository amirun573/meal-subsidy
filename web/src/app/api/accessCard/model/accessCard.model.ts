import { Prisma, AccessCard } from "@prisma/client";
import { prisma, timeout } from "../../../../../libs/prisma";
import logger from "../../../../../libs/winston";
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
    logger.error("Failed at CreateAccessCard function ===>", { error });

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
    logger.error("Failed at CreateAccessCardMany function ===>", { error });
    console.error(error);
    return [];
  }
}

export async function DisableAccessByUserId(object: {
  user_id: number;
  prismaTransaction?: any;
}) {
  try {
    const { user_id, prismaTransaction } = object;

    const query = Prisma.sql`UPDATE "AccessCard" SET active = false WHERE user_id = ${user_id}`;

    if (!prismaTransaction) {
      return await prisma.$queryRaw(query);
    } else {
      return await prismaTransaction.$queryRaw(query);
    }
  } catch (error) {
    logger.error("Failed at DisableAccessByUserId function ===>", { error });
    console.error(error);
    return null;
  }
}

export async function CreateAccessCardCascade(data: {
  accessCard: AccessCard;
}) {
  try {
    const { accessCard } = data;

    const result = await prisma.$transaction(
      async (prisma) => {
        const disableAccessCardPrevious = await DisableAccessByUserId({
          user_id: accessCard.user_id,
          prismaTransaction: prisma,
        });

        if (!disableAccessCardPrevious) {
          throw Error("Cannot Disabled Previous Access Card");
        }

        const accessCardTransaction = await CreateAccessCard({
          data: accessCard,
          prismaTransaction: prisma,
        });

        if (!accessCardTransaction) {
          throw Error("Cannot Create new Access Card");
        }
        return accessCardTransaction;
      },
      { timeout }
    );

    return result;
  } catch (error) {
    logger.error("Failed at CreateAccessCardCascade function ===>", { error });
    console.error(error);
    return null;
  }
}
