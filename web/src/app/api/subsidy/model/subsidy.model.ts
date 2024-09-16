import {
  Prisma,
  Subsidy,
  SubsidyCredit,
  SubsidyTransaction,
} from "@prisma/client";
import { prisma, timeout } from "../../../../../libs/prisma";
import {
  PrismaCondtionFetch,
  PrismaUpdate,
} from "@/_Common/interface/database.interface";
import { PaginationData } from "@/_Common/interface/pagination.interface";

export async function GetSubsidySingle(data: PrismaCondtionFetch) {
  try {
    const { where, select } = data;

    return prisma.subsidy.findFirst({
      where,
      select,
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function UpdateSubsidy(object: PrismaUpdate) {
  try {
    const { data, prismaTransaction } = object;

    const { subsidy_id, ...dataWithoutSubsidyId }: any = data;

    if (!prismaTransaction) {
      return await prisma.subsidy.update({
        data: dataWithoutSubsidyId,
        where: {
          subsidy_id,
        },
      });
    } else {
      return await prismaTransaction.subsidy.update({
        data: dataWithoutSubsidyId,
        where: {
          subsidy_id,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function GetSubsidyTypeSingle(data: PrismaCondtionFetch) {
  try {
    const { where, select } = data;

    return prisma.subsidyType.findFirst({
      where,
      select,
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function CreateSubsidy_4User(object: {
  data: Subsidy;
  prismaTransaction?: any;
}) {
  try {
    const { data, prismaTransaction } = object;

    if (!prismaTransaction) {
      return prisma.subsidy.create({
        data,
      });
    } else {
      return prismaTransaction.subsidy.create({
        data,
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function GetSubsidyCreditSingle(data: PrismaCondtionFetch) {
  try {
    const { where, select } = data;

    return prisma.subsidyCredit.findFirst({
      where,
      select,
    });
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function CreateSubsidyCredit(object: {
  data: SubsidyCredit;
  prismaTransaction?: any;
}) {
  try {
    const { data, prismaTransaction } = object;

    if (!prismaTransaction) {
      return prisma.subsidyCredit.create({
        data,
      });
    } else {
      return prismaTransaction.subsidyCredit.create({
        data,
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function UpdateSubsidyCredit(object: PrismaUpdate) {
  try {
    const { data, prismaTransaction } = object;

    const { subsidy_credit_id, ...WihoutSubsidy_credit_id } = data;

    if (!prismaTransaction) {
      return prisma.subsidyCredit.update({
        data: WihoutSubsidy_credit_id,
        where: {
          subsidy_credit_id,
        },
      });
    } else {
      return prismaTransaction.subsidyCredit.update({
        data: WihoutSubsidy_credit_id,
        where: {
          subsidy_credit_id,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function CreateSubsidyTransaction(object: {
  data: SubsidyTransaction;
  prismaTransaction?: any;
}) {
  try {
    const { data, prismaTransaction } = object;

    if (!prismaTransaction) {
      return prisma.subsidyTransaction.create({
        data,
      });
    } else {
      return prismaTransaction.subsidyTransaction.create({
        data,
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function UpdateSubsidyTransaction(object: PrismaUpdate) {
  try {
    const { data, prismaTransaction } = object;

    const { subsidy_transaction_id, ...WihoutSubsidy_transaction_id } = data;

    if (!prismaTransaction) {
      return prisma.subsidyTransaction.update({
        data: WihoutSubsidy_transaction_id,
        where: {
          subsidy_transaction_id,
        },
      });
    } else {
      return prismaTransaction.subsidyTransaction.update({
        data: WihoutSubsidy_transaction_id,
        where: {
          subsidy_transaction_id,
        },
      });
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function SubsidyCreditTransactionCascade(data: {
  subsidyCredit: SubsidyCredit;
  subsidyTransaction: SubsidyTransaction;
}) {
  try {
    const { subsidyCredit, subsidyTransaction } = data;
    const result = await prisma.$transaction(
      async (prisma) => {
        let subsidyCreditTransaction: any;

        if (!subsidyCredit?.subsidy_credit_id) {
          subsidyCreditTransaction = await CreateSubsidyCredit({
            data: subsidyCredit as any,
            prismaTransaction: prisma,
          });
        } else {
          subsidyCreditTransaction = await UpdateSubsidyCredit({
            data: subsidyCredit as any,
            prismaTransaction: prisma,
          });
        }

        if (!subsidyCreditTransaction) {
          throw Error("Failed in Subsidy Credit Transaction.");
        }

        subsidyTransaction.subsidy_credit_id =
          subsidyCreditTransaction?.subsidy_credit_id;

        let subsidyTransactionTransaction: any;

        if (!subsidyTransaction.subsidy_transaction_id) {
          subsidyTransactionTransaction = await CreateSubsidyTransaction({
            data: subsidyTransaction,
            prismaTransaction: prisma,
          });
        } else {
          subsidyTransactionTransaction = await UpdateSubsidyTransaction({
            data: subsidyTransaction,
            prismaTransaction: prisma,
          });
        }

        if (!subsidyTransaction) {
          throw Error("Failed in Subsidy Transaction Transaction.");
        }

        return [subsidyCreditTransaction, subsidyTransaction];
      },
      { timeout }
    );

    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function CreateSubsidyMany(object: {
  data: Subsidy[];
  prismaTransaction?: any;
}): Promise<Subsidy[]> {
  try {
    const { data, prismaTransaction } = object;

    if (!prismaTransaction) {
      return prisma.subsidy.createManyAndReturn({
        data,
        skipDuplicates: true,
      });
    } else {
      return prismaTransaction.subsidy.createManyAndReturn({
        data,
        skipDuplicates: true,
      });
    }
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function GetCountTotalSubsidyTransaction(
  data: PrismaCondtionFetch
) {
  try {
    const { where } = data;

    return prisma.subsidyTransaction.count({
      where,
    });
  } catch (error) {
    console.error(error);
    return 0;
  }
}

export async function GetSubsidyTransactionPagination(options: {
  paginate: PaginationData;
  select?: any;
  where: any;
  orderBy?: { field: string; direction: "asc" | "desc" };
}): Promise<any> {
  try {
    const { paginate, select, where, orderBy } = options;

    const limit = 10;
    const skip = (paginate.page - 1) * limit;

    return await prisma.subsidyTransaction.findMany({
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
