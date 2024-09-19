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
import { DownloadReportSubsidyTransactionResult } from "@/_Common/interface/subsidy.interface";
// import logger from "../../../../../libs/winston";

export async function GetSubsidySingle(data: PrismaCondtionFetch) {
  try {
    const { where, select } = data;

    return prisma.subsidy.findFirst({
      where,
      select,
    });
  } catch (error) {
    // logger.error("Failed at GetSubsidySingle function ===>", { error });

    console.error(error);
    return null;
  }
}

export async function GetSubsidyLists(data: PrismaCondtionFetch) {
  try {
    const { where, select } = data;

    return prisma.subsidy.findMany({
      where,
      select,
    });
  } catch (error) {
    // logger.error("Failed at GetSubsidyLists function ===>", { error });

    console.error(error);
    return [];
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
    // logger.error("Failed at UpdateSubsidy function ===>", { error });

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
    // logger.error("Failed at GetSubsidyTypeSingle function ===>", { error });

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
    // logger.error("Failed at CreateSubsidy_4User function ===>", { error });

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
    // logger.error("Failed at GetSubsidyCreditSingle function ===>", { error });

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
    // logger.error("Failed at CreateSubsidyCredit function ===>", { error });

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
    // logger.error("Failed at UpdateSubsidyCredit function ===>", { error });

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
    // logger.error("Failed at CreateSubsidyTransaction function ===>", { error });

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
    // logger.error("Failed at UpdateSubsidyTransaction function ===>", { error });

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
    // logger.error("Failed at SubsidyCreditTransactionCascade function ===>", { error });

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
    // logger.error("Failed at CreateSubsidyMany function ===>", { error });

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
    // logger.error("Failed at GetCountTotalSubsidyTransaction function ===>", { error });

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
    // logger.error("Failed at GetSubsidyTransactionPagination function ===>", { error });

    console.log(error);
    return null;
  }
}

export async function GetFilteredTransactions(data: {
  startDate: Date;
  endDate: Date;
  employees_id?: string[];
  department_id?: string; // Optional filter
  cost_center_id?: string; // Optional filter
  employee_category_id?: string; // Optional filter
}): Promise<DownloadReportSubsidyTransactionResult[]> {
  try {
    const {
      startDate,
      endDate,
      employees_id,
      department_id,
      cost_center_id,
      employee_category_id,
    } = data;

    // Start building the base query
    let query = `
    SELECT
        ud.name AS "name",
        u.employee_id AS "employee_id",
        d.department_name AS "department_name",
        cc.cost_center_code AS "cost_center_code",
        ec.employee_category_name AS "employee_category_name",
        st.credit_used AS "credit_used",
        TO_CHAR(st.transaction_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kuala_Lumpur', 'YYYY-MM-DD HH24:MI:SS') AS "transaction_at"
    FROM
        "SubsidyTransaction" st
    JOIN
        "User" u ON st.user_id = u.user_id
    JOIN
        "UserDetails" ud ON u.user_id = ud.user_id
    LEFT JOIN
        "Department" d ON u.department_id = d.department_id
    LEFT JOIN
        "CostCenter" cc ON u.cost_center_id = cc.cost_center_id
    LEFT JOIN
        "EmployeeCategory" ec ON u.employee_category_id = ec.employee_category_id
    WHERE
        st.transaction_at BETWEEN $1::timestamp AND $2::timestamp
    AND
        st.active = TRUE
    `;

    // Initialize query parameters
    const queryParams: any[] = [startDate, endDate];

    // Add employees_id filter if provided
    if (employees_id && employees_id.length > 0) {
      query += ` AND u.employee_id IN (${employees_id
        .map((_, i) => `$${i + 3}`)
        .join(", ")})`;
      queryParams.push(...employees_id);
    }

    // Add department_id filter if provided
    if (department_id) {
      query += ` AND u.department_id = $${queryParams.length + 3}`;
      queryParams.push(department_id);
    }

    // Add cost_center_id filter if provided
    if (cost_center_id) {
      query += ` AND u.cost_center_id = $${queryParams.length + 3}`;
      queryParams.push(cost_center_id);
    }

    // Add employee_category_id filter if provided
    if (employee_category_id) {
      query += ` AND u.employee_category_id = $${queryParams.length + 3}`;
      queryParams.push(employee_category_id);
    }

    // Execute the query with the dynamically built query and parameters
    const result: DownloadReportSubsidyTransactionResult[] =
      await prisma.$queryRawUnsafe(query, ...queryParams);

    return result;
  } catch (error) {
    console.error(error);
    return [];
  }
}

export async function DisableAllSubsidyCredit(object: {
  prismaTransaction: any;
}) {
  try {
    const { prismaTransaction } = object;
    const query = Prisma.sql`UPDATE "SubsidyCredit" SET active = false;`;

    if (!prismaTransaction) {
      return await prisma.$queryRaw(query);
    } else {
      return await prismaTransaction.$queryRaw(query);
    }
  } catch (error) {
    // logger.error("Failed at DisableAllSubsidyCredit function ===>", { error });
    console.error(error);
    return null;
  }
}

export async function CreateSubsidyCreditMany(object: {
  data: SubsidyCredit[];
  prismaTransaction?: any;
}) {
  try {
    const { data, prismaTransaction } = object;

    if (!prismaTransaction) {
      return prisma.subsidyCredit.createMany({
        data,
      });
    } else {
      return prismaTransaction.subsidyCredit.createMany({
        data,
      });
    }
  } catch (error) {
    // logger.error("Failed at CreateSubsidyCreditMany function ===>", { error });

    console.error(error);
    return [];
  }
}
export async function TriggerSubsidyCreditCascade(data: {
  subsidiesCredit: SubsidyCredit[];
}) {
  try {
    const { subsidiesCredit } = data;
    const result = await prisma.$transaction(
      async (prisma) => {
        const deactiveSubsidyCredit = await DisableAllSubsidyCredit({
          prismaTransaction: prisma,
        });

        if (!deactiveSubsidyCredit) {
          throw Error("Failed to Flush Subsidy Credit");
        }

        const subsidyCreditTransaction: SubsidyCredit[] =
          await CreateSubsidyCreditMany({
            data: subsidiesCredit,
            prismaTransaction: prisma,
          });

        if (!subsidyCreditTransaction || subsidyCreditTransaction.length < 1) {
          throw Error("No Subsidy Credit Being Created");
        }

        return subsidyCreditTransaction;
      },
      { timeout }
    );

    return result;
  } catch (error) {
    // logger.error("Failed at TriggerSubsidyCreditCascade function ===>", { error });

    console.error(error);
    return null;
  }
}

export async function GetCountTotalSubsidyType(data: PrismaCondtionFetch) {
  try {
    const { where } = data;

    return prisma.subsidyType.count({
      where,
    });
  } catch (error) {
    // logger.error("Failed at GetCountTotalSubsidyTransaction function ===>", { error });

    console.error(error);
    return 0;
  }
}

export async function GetSubsidyTypePagination(options: {
  paginate: PaginationData;
  select?: any;
  where: any;
  orderBy?: { field: string; direction: "asc" | "desc" };
}): Promise<any> {
  try {
    const { paginate, select, where, orderBy } = options;

    const limit = 10;
    const skip = (paginate.page - 1) * limit;

    return await prisma.subsidyType.findMany({
      skip: skip >= paginate.totalItems ? 0 : skip,
      take: Math.min(limit, paginate.totalItems - skip),
      where,
      select,
      orderBy: orderBy ? { [orderBy.field]: orderBy.direction } : undefined,
    });

    //const page = data.get("page");
  } catch (error) {
    // logger.error("Failed at GetSubsidyTransactionPagination function ===>", { error });

    console.log(error);
    return null;
  }
}

export async function UpdateSubsidyTypeSingle(object: PrismaUpdate) {
  try {
    const { data, prismaTransaction } = object;

    const { subsidy_type_id, ...dataWithoutId }: any = data;

    if (!prismaTransaction) {
      return await prisma.subsidyType.update({
        data: dataWithoutId,
        where: {
          subsidy_type_id,
        },
      });
    } else {
      return await prismaTransaction.subsidyType.update({
        data: dataWithoutId,
        where: {
          subsidy_type_id,
        },
      });
    }
  } catch (error) {
    // logger.error("Failed at UpdateSubsidy function ===>", { error });

    console.error(error);
    return null;
  }
}
