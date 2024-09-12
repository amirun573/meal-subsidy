import { User, UserDetails } from "@prisma/client";
import { PrismaCondtionFetch } from "@/_Common/interface/database.interface";
import { prisma, timeout } from "../../../../../libs/prisma";
import { PaginationData } from "@/_Common/interface/pagination.interface";

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

export async function GetTotalUser(data: PrismaCondtionFetch) {
  try {
    const { where } = data;

    return prisma.user.count({
      where,
    });
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export async function GetUserPagination(options: {
  paginate: PaginationData;
  select?: any;
  where: any;
  orderBy?: { field: string; direction: "asc" | "desc" };
}): Promise<any> {
  try {
    const { paginate, select, where, orderBy } = options;

    const limit = 10;
    const skip = (paginate.page - 1) * limit;

    return await prisma.user.findMany({
      skip: skip >= paginate.totalItems ? 0 : skip,
      take: Math.min(limit, paginate.totalItems - skip),
      where,
      select,
      orderBy: orderBy ? { [orderBy.field]: orderBy.direction } : undefined,
    });

    //const page = data.get("page");
  } catch (error) {
    return null;
  }
}

async function CreateUser(object: { user: User; prismaTransaction?: any }) {
  try {
    const { user, prismaTransaction } = object;

    if (!prismaTransaction) {
      return prisma.user.create({
        data: user,
      });
    } else {
      return prismaTransaction.user.create({
        data: user,
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function UpdateUser(object: { user: User; prismaTransaction?: any }) {
  try {
    const { user, prismaTransaction } = object;

    const { user_id, ...UserWithoutUserID } = user;

    if (!prismaTransaction) {
      return prisma.user.update({
        data: UserWithoutUserID,
        where: {
          user_id,
        },
      });
    } else {
      return prismaTransaction.user.update({
        data: UserWithoutUserID,
        where: {
          user_id,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function CreateUserDetails(object: {
  userDetails: UserDetails;
  prismaTransaction?: any;
}) {
  try {
    const { userDetails, prismaTransaction } = object;

    if (!prismaTransaction) {
      return prisma.userDetails.create({
        data: userDetails,
      });
    } else {
      return prismaTransaction.userDetails.create({
        data: userDetails,
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

async function UpdateUserDetails(object: {
  userDetails: UserDetails;
  prismaTransaction?: any;
}) {
  try {
    const { userDetails, prismaTransaction } = object;

    const { UserDetails_id, ...UserWithoutUserDetailsID } = userDetails;

    if (!prismaTransaction) {
      return prisma.userDetails.update({
        data: UserWithoutUserDetailsID,
        where: {
          UserDetails_id,
        },
      });
    } else {
      return prismaTransaction.userDetails.update({
        data: UserWithoutUserDetailsID,
        where: {
          UserDetails_id,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function CreateUserNUserDetailsCascade(data: {
  user: User;
  userDetails: UserDetails;
}) {
  try {
    const { user, userDetails } = data;

    const result = await prisma.$transaction(
      async (prisma) => {
        let userTransaction: any;

        if (!user.user_id) {
          userTransaction = await CreateUser({
            user,
            prismaTransaction: prisma,
          });
        } else {
          userTransaction = await UpdateUser({
            user,
            prismaTransaction: prisma,
          });
        }

        if (!userTransaction) {
          throw Error("Failed to Create User");
        }

        userDetails.user_id = userTransaction?.user_id;

        let userDetailsTrancation: any;

        if (!userDetails.UserDetails_id) {
          userDetailsTrancation = await CreateUserDetails({
            userDetails,
            prismaTransaction: prisma,
          });
        } else {
          userDetailsTrancation = await UpdateUserDetails({
            userDetails,
            prismaTransaction: prisma,
          });
        }

        if (!userDetailsTrancation) {
          throw Error("Failed to Create User Details");
        }

        return [userTransaction, userDetailsTrancation];
      },
      { timeout }
    );

    return result;
  } catch (error) {}
}
