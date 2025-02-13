import { AccessCard, Subsidy, User, UserDetails } from "@prisma/client";
import { PrismaCondtionFetch } from "@/_Common/interface/database.interface";
import { prisma, timeout } from "../../../../../libs/prisma";
import { PaginationData } from "@/_Common/interface/pagination.interface";
import {
  CreateUserUserDetails,
  UpdateUserUserDetails,
} from "@/_Common/interface/user.interface";
import {
  CreateSubsidyMany,
  UpdateSubsidiesInBulk,
} from "../../subsidy/model/subsidy.model";
import { CreateAccessCardMany } from "../../accessCard/model/accessCard.model";
// import logger from "../../../../../libs/winston";

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
    // logger.error("Failed at GetUserSingle function ===>", { error });

    console.error(error);
    return null;
  }
}

export async function GetUserMany(data: PrismaCondtionFetch) {
  try {
    const { where, select } = data;

    return prisma.user.findMany({
      where,
      select,
    });
  } catch (error) {
    // logger.error("Failed at GetUserSingle function ===>", { error });

    console.error(error);
    return [];
  }
}

export async function GetUserRawQuery() {
  try {
    let query = `
    SELECT 
    d.department_name AS "Department Desc",
    cc.cost_center_code AS "Value Stream",
    u.employee_id AS "Employee Id",
    UPPER(ud.name) AS "Employee Name",
    ec.employee_category_code AS "Employee Category",
    CASE 
        WHEN s.subsidy_id IS NOT NULL THEN 'Yes' 
        ELSE 'No' 
    END AS "Eligible Subsidy (Yes/No)",
    ud.access_card_no AS "Access Card Number",
    u.uuid AS "UUID"
FROM 
    "User" u
LEFT JOIN "UserDetails" ud ON u.user_id = ud.user_id
LEFT JOIN "EmployeeCategory" ec ON u.employee_category_id = ec.employee_category_id
LEFT JOIN "Department" d ON u.department_id = d.department_id
LEFT JOIN "CostCenter" cc ON u.cost_center_id = cc.cost_center_id
LEFT JOIN "Subsidy" s ON u.user_id = s.user_id AND s.active = TRUE
LEFT JOIN "AccessCard" ac ON u.user_id = ac.user_id AND ac.active = TRUE
WHERE 
    u.deleted_at IS NULL AND u.active = TRUE
ORDER BY 
    u.employee_id;
`;

    return await prisma.$queryRawUnsafe(query);
  } catch (error) {
    // logger.error("Failed at GetUserSingle function ===>", { error });

    console.error(error);
    return [];
  }
}

export async function GetTotalUser(data: PrismaCondtionFetch) {
  try {
    const { where } = data;

    return prisma.user.count({
      where,
    });
  } catch (error) {
    // logger.error("Failed at GetTotalUser function ===>", { error });

    console.error(error);
    return 0;
  }
}

export async function GetUserPagination(options: {
  paginate: PaginationData;
  select?: any;
  where: any;
  orderBy?: { field: string; direction: "asc" | "desc" };
  include?: any;
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
    // logger.error("Failed at GetUserPagination function ===>", { error });

    console.error(error);
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
    // logger.error("Failed at CreateUser function ===>", { error });

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
    // logger.error("Failed at CreateUserMany function ===>", { error });

    console.error(error);
    return [];
  }
}

async function UpdateUserMany(object: {
  data: User[];
  prismaTransaction?: any;
}) {
  try {
    const { data, prismaTransaction } = object;
    const prismaClient = prismaTransaction || prisma;

    const updates = data.map(({ user_id, ...updateData }) => ({
      where: { user_id },
      data: updateData,
    }));

    await Promise.all(
      updates.map(({ where, data }) =>
        prismaClient.user.updateMany({
          where,
          data,
        })
      )
    );

    // Retrieve the updated users after update
    const updatedUsers = await prismaClient.user.findMany({
      where: {
        user_id: { in: data.map((user) => user.user_id) },
      },
    });

    return updatedUsers;
  } catch (error) {
    console.error("Error in UpdateUserMany:", error);
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
    // logger.error("Failed at CreateUserDetailsMany function ===>", { error });

    console.error(error);
    return [];
  }
}

export async function UpdateUser(object: {
  user: User;
  prismaTransaction?: any;
}) {
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
    // logger.error("Failed at UpdateUser function ===>", { error });

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
    // logger.error("Failed at CreateUserDetails function ===>", { error });

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
    // logger.error("Failed at UpdateUserDetails function ===>", { error });

    console.error(error);
    return null;
  }
}

async function UpdateUserDetailsMany(object: {
  data: UserDetails[];
  prismaTransaction?: any;
}) {
  try {
    const { data, prismaTransaction } = object;
    const prismaClient = prismaTransaction || prisma;

    const updates = data.map(({ user_id, ...updateData }) => ({
      where: { user_id },
      data: updateData,
    }));

    await Promise.all(
      updates.map(({ where, data }) =>
        prismaClient.userDetails.updateMany({
          where,
          data,
        })
      )
    );

    // Retrieve updated user_id after update
    const updatedUsers = await prismaClient.userDetails.findMany({
      where: {
        user_id: { in: data.map((user) => user.user_id) },
      },
      select: { user_id: true }, // Only fetch user_id
    });

    return updatedUsers;
  } catch (error) {
    console.error("Error in UpdateUserDetailsMany:", error);
    return [];
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
    // logger.error("Failed at CreateUserNUserDetailsCascade function ===>", {
    //   error,
    // });

    console.error(error);
    return null;
  }
}

export async function CreateUserNUserDetailsManyCascade(data: {
  details: CreateUserUserDetails[];
  prismaTransaction?: any;
}): Promise<CreateUserUserDetails[]> {
  try {
    const { details, prismaTransaction } = data;

    let result: CreateUserUserDetails[] = [];
    if (details.length > 0) {
      // Extract user[] from details
      const users: User[] = details.map((detail) => detail.user);

      // Create users in bulk using the provided transaction
      const userTransaction: User[] = await CreateUserMany({
        data: users,
        prismaTransaction,
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

        // // Update user_id for both user and userDetails in the details array
        detail.user.user_id = user.user_id;
        detail.userDetails.user_id = user.user_id;

        // Check if 'subsidy' exists before assigning 'user_id'
        if (detail.subsidy) {
          detail.subsidy.user_id = user.user_id;

          createSubsidies.push(detail.subsidy);
        }

        // if (detail.accessCard) {
        //   detail.accessCard.user_id = user.user_id;
        //   createAccessCard.push(detail.accessCard);
        // }

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
        prismaTransaction,
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
          prismaTransaction,
        });

        if (subsidyTransaction.length !== createSubsidies.length) {
          throw Error("Failed To Create User Subsidy ");
        }
      }

      if (createAccessCard.length > 0) {
        const accessCardTransaction = await CreateAccessCardMany({
          data: createAccessCard,
          prismaTransaction,
        });

        if (accessCardTransaction.length !== createSubsidies.length) {
          throw Error("Failed To Access Card Details To All Users");
        }
      }

      return updateDetails; // Return the updated details array
    }

    return result; // Return the result from the transaction
  } catch (error) {
    // logger.error("Failed at CreateUserNUserDetailsManyCascade function ===>", {
    //   error,
    // });

    console.error(error);
    return []; // Return an empty array in case of an error
  }
}

export async function UpdateUserCascade(data: {
  details: CreateUserUserDetails[];
}): Promise<CreateUserUserDetails[]> {
  try {
    const { details } = data;

    const result: CreateUserUserDetails[] = await prisma.$transaction(
      async (prisma) => {
        const updateDetails: CreateUserUserDetails[] = [];
        const subsidiesToUpdate: Subsidy[] = [];
        const accessCardsToUpdate: AccessCard[] = [];

        console.log("details==>", details);

        // for (const detail of details) {
        //   // Update or create the user
        //   const user = await prisma.userDetails.upsert({
        //     where: { user_id: detail.user.user_id },
        //     update: {
        //       name: detail.userDetails.name,
        //       de: detail.user.department,
        //       // Add other fields as needed
        //     },
        //     create: detail.user,
        //   });

        //   // Assign user_id to related records
        //   detail.user.user_id = user.user_id;
        //   detail.userDetails.user_id = user.user_id;

        //   // Add subsidies and access cards to respective arrays
        //   if (detail.subsidy) {
        //     subsidiesToUpdate.push({
        //       ...detail.subsidy,
        //       user_id: user.user_id,
        //     });
        //   }

        //   if (detail.accessCard) {
        //     accessCardsToUpdate.push({
        //       ...detail.accessCard,
        //       user_id: user.user_id,
        //     });
        //   }

        //   // Upsert UserDetails
        //   await prisma.userDetails.upsert({
        //     where: { user_id: detail.userDetails.user_id },
        //     update: detail.userDetails,
        //     create: detail.userDetails,
        //   });

        //   updateDetails.push(detail);
        // }

        // // Bulk upsert subsidies
        // for (const subsidy of subsidiesToUpdate) {
        //   await prisma.subsidy.upsert({
        //     where: { user_id: subsidy.user_id },
        //     update: subsidy,
        //     create: subsidy,
        //   });
        // }

        // // Bulk upsert access cards
        // for (const accessCard of accessCardsToUpdate) {
        //   await prisma.accessCard.upsert({
        //     where: { user_id: accessCard.user_id },
        //     update: accessCard,
        //     create: accessCard,
        //   });
        // }

        return updateDetails;
      },
      { timeout: 10000 } // Adjust the timeout as needed
    );

    return result;
  } catch (error) {
    console.error("Error in updateUserCascade:", error);
    throw new Error("Failed to update user and related details.");
  }
}


export async function UpdateUserManyCascade(data: {
  details: UpdateUserUserDetails[];
  prismaTransaction?: any;
}): Promise<boolean> {
  try {
    const { details, prismaTransaction } = data;

    let result: UpdateUserUserDetails[] = [];
    if (details.length > 0) {
      // Extract user[] from details
      const users: User[] = details.map((detail) => detail.user);

      // Create users in bulk using the provided transaction
      const userTransaction: User[] = await UpdateUserMany({
        data: users,
        prismaTransaction: prisma,
      });

      // Validate that the same number of users were created
      if (!userTransaction || userTransaction.length !== users.length) {
        throw Error("No Users Been Created");
      }


      const createAccessCard: AccessCard[] = [];

      // Extract userDetails[] from the updated details array
      const usersDetails: UserDetails[] = details.map(
        (detail) => detail.userDetails
      );

      // Create userDetails in bulk using the same transaction
      const userDetailsTransaction = await UpdateUserDetailsMany({
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

      const subsidies: Subsidy[] = details.map(
        (detail) => detail.subsidy as any
      );

      if (subsidies.length > 0) {

        const subsidyTransaction = await UpdateSubsidiesInBulk({
          subsidies,
          prismaTransaction: prisma,
        });

        console.log("subsidyTransaction==>", subsidyTransaction);

        if (subsidyTransaction !== subsidies.length) {
          throw Error("Failed To Create User Subsidy ");
        }
      }

      const accessCard: AccessCard[] = details.map(
        (detail) => detail.accessCard as any
      );

      if (createAccessCard.length > 0) {
        const accessCardTransaction = await CreateAccessCardMany({
          data: createAccessCard,
          prismaTransaction: prisma,
        });

        if (accessCardTransaction.length !== accessCard.length) {
          throw Error("Failed To Access Card Details To All Users");
        }
      }

      return true; // Return the updated details array
    }

    return true; // Return the result from the transaction
  } catch (error) {
    // logger.error("Failed at CreateUserNUserDetailsManyCascade function ===>", {
    //   error,
    // });

    console.error(error);
    return false; // Return an empty array in case of an error
  }
}

export async function CreateUpdateUserCascade(data: {
  create: CreateUserUserDetails[];
  update: UpdateUserUserDetails[];
}): Promise<boolean> {
  try {
    const { create, update } = data;

    await prisma.$transaction(
      async (prismaTransaction) => {
        try {
          await Promise.all([
            CreateUserNUserDetailsManyCascade({
              details: create,
              prismaTransaction,
            }),
            UpdateUserManyCascade({
              details: update,
              prismaTransaction,
            }),
          ]);
        } catch (error) {
          console.error("Transaction failed, rolling back...", error);
          throw error; // Ensures rollback happens
        }
      },
      { timeout }
    );

    return true;
  } catch (error) {
    console.log("Error in CreateUpdateUserCascade:", error);
    return false;
  }
}
