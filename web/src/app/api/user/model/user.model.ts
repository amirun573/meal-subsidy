import { AccessCard, Subsidy, User, UserDetails } from "@prisma/client";
import { PrismaCondtionFetch } from "@/_Common/interface/database.interface";
import { prisma, timeout } from "../../../../../libs/prisma";
import { PaginationData } from "@/_Common/interface/pagination.interface";
import { CreateUserUserDetails } from "@/_Common/interface/user.interface";
import { CreateSubsidyMany } from "../../subsidy/model/subsidy.model";
import { CreateAccessCardMany } from "../../accessCard/model/accessCard.model";

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
  include?: any
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

async function CreateUserMany(object: {
  data: User[];
  prismaTransaction?: any;
}) {
  try {
    const { data, prismaTransaction } = object;

    if (!prismaTransaction) {
      return prisma.user.createManyAndReturn({
        data,
      });
    } else {
      return prismaTransaction.user.createManyAndReturn({
        data,
      });
    }
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function CreateUserDetailsMany(object: {
  data: UserDetails[];
  prismaTransaction?: any;
}) {
  try {
    const { data, prismaTransaction } = object;

    if (!prismaTransaction) {
      return prisma.userDetails.createManyAndReturn({
        data,
        skipDuplicates: true,
      });
    } else {
      return prismaTransaction.userDetails.createManyAndReturn({
        data,
        skipDuplicates: true,
      });
    }
  } catch (error) {
    console.error(error);
    return [];
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

        if (user.user_id) {
          userTransaction = await UpdateUser({
            user,
            prismaTransaction: prisma,
          });
        } else {
          userTransaction = await CreateUser({
            user,
            prismaTransaction: prisma,
          });
        }

        if (!userTransaction) {
          throw Error("Failed to Create User");
        }

        userDetails.user_id = userTransaction?.user_id;

        let userDetailsTrancation: any;

        if (userDetails.UserDetails_id) {
          userDetailsTrancation = await UpdateUserDetails({
            userDetails,
            prismaTransaction: prisma,
          });
        } else {
          userDetailsTrancation = await CreateUserDetails({
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
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function CreateUserNUserDetailsManyCascade(data: {
  details: CreateUserUserDetails[];
}): Promise<CreateUserUserDetails[]> {
  try {
    const { details } = data;

    const result: CreateUserUserDetails[] = await prisma.$transaction(
      async (prisma) => {
        // Extract user[] from details
        const users: User[] = details.map((detail) => detail.user);

        // Create users in bulk using the provided transaction
        const userTransaction: User[] = await CreateUserMany({
          data: users,
          prismaTransaction: prisma,
        });

        console.log("users.length==>", users.length);
        console.log("userTransaction.length==>", userTransaction.length);

        // Validate that the same number of users were created
        if (!userTransaction || userTransaction.length !== users.length) {
          throw Error("No Users Been Created");
        }

        const updateDetails: CreateUserUserDetails[] = [];

        const createSubsidies: Subsidy[] = [];
        const createAccessCard: AccessCard[] = [];

        // Use forEach since you're performing side effects (modifying details)
        details.forEach((detail) => {
          // Find the created user using the employee_id
          const user: User | undefined = userTransaction.find(
            (item) => item.employee_id === detail.user.employee_id
          );

          if (!user) {
            throw Error("Cannot Find User That Has Been Inserted.");
          }

          // Update user_id for both user and userDetails in the details array
          detail.user.user_id = user.user_id;
          detail.userDetails.user_id = user.user_id;

          // Check if 'subsidy' exists before assigning 'user_id'
          if (detail.subsidy) {
            detail.subsidy.user_id = user.user_id;

            createSubsidies.push(detail.subsidy);
          }

          if (detail.accessCard) {
            detail.accessCard.user_id = user.user_id;
            createAccessCard.push(detail.accessCard);
          }

          // Push the updated detail to the updateDetails array
          updateDetails.push(detail);
        });

        // Extract userDetails[] from the updated details array
        const usersDetails: UserDetails[] = updateDetails.map(
          (detail) => detail.userDetails
        );

        // Create userDetails in bulk using the same transaction
        const userDetailsTransaction = await CreateUserDetailsMany({
          data: usersDetails,
          prismaTransaction: prisma,
        });

        // Validate that the same number of userDetails were created
        if (
          !userDetailsTransaction ||
          userDetailsTransaction.length !== usersDetails.length
        ) {
          throw Error("No User Details Been Created");
        }

        if (createSubsidies.length > 0) {
          const subsidyTransaction = await CreateSubsidyMany({
            data: createSubsidies,
            prismaTransaction: prisma,
          });

          if (subsidyTransaction.length !== createSubsidies.length) {
            throw Error("Failed To Create User Subsidy ");
          }
        }

        if (createAccessCard.length > 0) {
          const accessCardTransaction = await CreateAccessCardMany({
            data: createAccessCard,
            prismaTransaction: prisma,
          });

          if (accessCardTransaction.length !== createSubsidies.length) {
            throw Error("Failed To Access Card Details To All Users");
          }
        }

        return updateDetails; // Return the updated details array
      },
      { timeout }
    );

    return result; // Return the result from the transaction
  } catch (error) {
    console.error(error);
    return []; // Return an empty array in case of an error
  }
}
