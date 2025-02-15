import { Prisma, AccessCard } from "@prisma/client";
import { prisma, timeout } from "../../../../../libs/prisma";
// import logger from "../../../../../libs/winston";
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
    // logger.error("Failed at CreateAccessCard function ===>", { error });

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
    // logger.error("Failed at CreateAccessCardMany function ===>", { error });
    console.error(error);
    return [];
  }
}

export async function UpdateAccessCardsInBulk(data: {
  accessCards: AccessCard[];
  prismaTransaction?: any;
}): Promise<number> {
  try {
    const { accessCards, prismaTransaction } = data;
    const setClauses: string[] = [];
    const values: any[] = [];
    const cardIds: number[] = accessCards.map((card) => card.card_id);

    const fieldsToUpdate = [
      "card_value",
      "active",
      "user_id",
    ];

    for (const field of fieldsToUpdate) {
      const cases: string[] = [];
      accessCards.forEach((card: any) => {
        if (card[field] !== undefined) {
          cases.push(`WHEN "card_id" = $${values.length + 1} THEN $${values.length + 2}`);
          values.push(card.card_id, card[field]);
        }
      });

      if (cases.length > 0) {
        setClauses.push(`"${field}" = CASE ${cases.join(" ")} ELSE "${field}" END`);
      }
    }

    // Ensure there's something to update
    if (setClauses.length === 0) {
      console.warn("No valid updates found");
      return 0;
    }

    // Construct final query
    const query = `
      UPDATE "AccessCard"
      SET ${setClauses.join(", ")}, "updated_at" = NOW()
      WHERE "card_id" IN (${cardIds.map((_, index) => `$${values.length + index + 1}`).join(", ")});
    `;

    values.push(...cardIds);

    // Execute the query
    let result: number;
    if (!prismaTransaction) {
      result = await prisma.$executeRawUnsafe(query, ...values);
    } else {
      result = await prismaTransaction.$executeRawUnsafe(query, ...values);
    }

    return result;
  } catch (e) {
    console.error(e);
    return 0;
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
    // logger.error("Failed at DisableAccessByUserId function ===>", { error });
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
    // logger.error("Failed at CreateAccessCardCascade function ===>", { error });
    console.error(error);
    return null;
  }
}
