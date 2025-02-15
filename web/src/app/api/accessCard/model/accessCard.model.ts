import { Prisma, AccessCard, User } from "@prisma/client";
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

export async function UpsertAccessCardsInBulk(data: {
  accessCards: AccessCard[];
  prismaTransaction?: any;
}): Promise<number> {
  try {
    const { accessCards, prismaTransaction } = data;
    const prismaClient = prismaTransaction || prisma;

    // Separate new and existing cards
    const existingCards = accessCards.filter(
      (card) => card.card_id !== undefined
    );
    let newCards = accessCards.filter((card) => card.card_id === undefined);

    let affectedRows = 0;

    // Check existing access cards in DB
    const userIds = [
      ...new Set(
        newCards.map((card) => card.user_id).filter((id) => id !== undefined)
      ),
    ];

    if (userIds.length > 0) {
      const existingUserCards = await prismaClient.accessCard.findMany({
        where: { user_id: { in: userIds } },
        select: { user_id: true, card_value: true },
      });

      // Filter newCards: Ignore empty values for users who never had an access card before
      newCards = newCards.filter((newCard) => {
        const hasPreviousCard = existingUserCards.some(
          (user: User) => user.user_id === newCard.user_id
        );
        return (
          hasPreviousCard ||
          (typeof newCard.card_value === "string" &&
            newCard.card_value?.trim() !== "")
        );
      });
    }
    const existingUserCards = await prismaClient.accessCard.findMany({
      where: { user_id: { in: userIds } },
      select: { user_id: true, card_value: true },
    });

    // Filter newCards: Ignore empty values for users who never had an access card before
    newCards = newCards.filter((newCard) => {
      const hasPreviousCard = existingUserCards.some(
        (user: User) => user.user_id === newCard.user_id
      );
      return (
        hasPreviousCard ||
        (typeof newCard.card_value === "string" &&
          newCard.card_value?.trim() !== "")
      );
    });

    console.log("existingUserCards==>", existingUserCards);
    console.log("newCards==>", newCards);

    // 1. Bulk Insert New Cards
    if (newCards.length > 0) {
      const insertData = newCards.map((card) => ({
        card_value: card.card_value,
        active: card.active,
        user_id: card.user_id,
        created_at: new Date(),
        updated_at: new Date(),
      }));

      const insertedCards = await prismaClient.accessCard.createMany({
        data: insertData,
        skipDuplicates: true, // Ensure no duplicate inserts
      });

      affectedRows += insertedCards.count;
    }

    // 2. Bulk Update Existing Cards
    if (existingCards.length > 0) {
      for (const card of existingCards) {
        await prismaClient.accessCard.update({
          where: { card_id: card.card_id },
          data: {
            card_value: card.card_value,
            active: card.active,
            user_id: card.user_id,
            updated_at: new Date(),
          },
        });
      }

      affectedRows += existingCards.length;
    }

    return affectedRows;
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
