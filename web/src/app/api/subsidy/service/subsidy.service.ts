import {
  SubsidyEmployeeUpdate,
  SubsidySubmitPrice,
  SubsidyTransactionDownloadReportRequest,
  SubsidyTransactionPaginationRequest,
  DownloadReportSubsidyTransactionResult,
  SubsidyTypePaginationRequest,
  UpdateSubsidyCreditRequest,
} from "@/_Common/interface/subsidy.interface";
import {
  EmployeeSubmitPriceValidation,
  EmployeeUpdateSubsidyValidation,
  SubsidyTransactionPagination,
  SubsidyTransactionReportDownload,
  SubsidyTypePagination,
  UpdateSubsidyCreditRealTimeValidation,
  UpdateSubsidyTypeValidation,
} from "@/_Common/validation/subsidy.validation";
import {
  $Enums,
  Prisma,
  Subsidy,
  SubsidyCredit,
  SubsidyTransaction,
  SubsidyType,
  User,
} from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";
import {
  GetCountTotalSubsidyTransaction,
  GetSubsidySingle,
  SubsidyCreditTransactionCascade,
  UpdateSubsidy,
  UpdateSubsidyCredit,
  GetSubsidyTransactionPagination,
  GetFilteredTransactions,
  UpdateSubsidiesInBulk,
  GetSubsidyTypePagination,
  GetCountTotalSubsidyType,
  GetSubsidyTypeSingle,
  UpdateSubsidyTypeSingle,
  GetSubsidyCreditSingle,
  SubsidyCreditCascade,
  GetSubsidySchedules,
  DeleteSubsidySchedule,
  GetSubsidyScheduleLogs,
} from "../model/subsidy.model";
import { GetUserSingle } from "../../user/model/user.model";
import { SubsidyTypeCode } from "@/_Common/enum/subsidy-type.enum";
import { ConvertExcel } from "@/_Common/function/SpreedSheet";
import { FileMimeType } from "@/_Common/enum/file-type.enum";
import {
  GetUserFeatures,
  GetUserFeaturesSingle,
} from "../../feature/model/feature.model";
import { GetDepartmentSingle } from "../../department/model/department.model";
import { assertValidRoutine, getDueCreditRun } from "@/_Common/function/credit-schedule";

export async function UpdateUserApplicableSubsidy(data: SubsidyEmployeeUpdate) {
  let message: string = "";
  let status: number = 500;
  try {
    await EmployeeUpdateSubsidyValidation(data);

    const { uuid, applicable, subsidy_uuid } = data;

    const subsidy: Partial<Subsidy> = (await GetSubsidySingle({
      where: {
        user: {
          uuid,
        },
        subsidy_type: {
          uuid: subsidy_uuid,
        },
      },
    })) as Partial<Subsidy>;

    if (!subsidy) {
      status = 400;
      throw Error("No Subsidy Found");
    }

    const updateSubsidy: Partial<Subsidy> = {
      subsidy_id: subsidy.subsidy_id,
      applicable,
    };

    const updateSubsidyProcess = await UpdateSubsidy({ data: updateSubsidy });

    if (!updateSubsidyProcess) {
      status = 400;
      throw Error("Failed To Update Subsidy");
    }

    return NextResponse.json({
      updateSubsidy: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || message,
      },
      {
        status: error.statusCode || status,
      }
    );
  }
}

//TODO: Will Be Depriacted. Only Authenticate User can execute.
export async function CreateSubsidyTransactionService(
  data: SubsidySubmitPrice
) {
  let message: string = "";
  let status: number = 500;
  try {
    await EmployeeSubmitPriceValidation(data);

    const {
      totalPrice,
      price,
      availableCredit,
      discount,
      employee_id,
      subsidyCreditUUID,
    } = data;

    console.log("DATA==>", data);
    const user = await GetUserSingle({
      where: {
        employee_id,
        subsidies: {
          some: {
            subsidy_type: {
              subsidy_type_code: SubsidyTypeCode.meal,
            },
            subsidy_credits: {
              some: {
                active: true,
                uuid: {
                  in: [subsidyCreditUUID],
                },
              },
            },
            OR: [
              { end_date: null }, // Include subsidies where end_date is not set
              { end_date: { gt: new Date() } }, // Include subsidies where end_date is greater than the current time
            ],
          },
        },
      },

      select: {
        user_id: true,
        subsidies: {
          select: {
            subsidy_id: true,
            subsidy_credits: {
              where: {
                active: true,
              },
              select: {
                subsidy_credit_id: true,
                credit_amount: true,
                uuid: true,
                active: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      status = 400;
      throw Error("Credit Has Been Finished/ Expired");
    }

    const { subsidies, ...UserWihoutSubsidy } = user as any;

    const subsidiesCheck: Subsidy[] = subsidies as Subsidy[];

    if (subsidiesCheck.length !== 1) {
      status = 400;
      throw Error("Wrong Setup For Subsidy");
    }

    const subsidy: Subsidy = subsidiesCheck[0];

    const SubsidyCredits: SubsidyCredit[] = [];

    subsidiesCheck.forEach((subsidy) => {
      // Type assertion to access subsidy_credits
      const checkSubsidyCredits: SubsidyCredit[] = (subsidy as any)
        ?.subsidy_credits;

      console.log("checkSubsidyCredits===>", checkSubsidyCredits);

      // Check if there is exactly one credit
      if (checkSubsidyCredits.length !== 1) {
        throw new Error("Wrong Setup Subsidy Credit");
      }

      // Push the single credit to the SubsidyCredits array
      SubsidyCredits.push(checkSubsidyCredits[0]);
    });

    if (SubsidyCredits.length !== 1) {
      status = 400;
      throw Error("Wrong Setup For Subsidy Credit");
    }

    const subsidy_credits: Partial<SubsidyCredit> = SubsidyCredits[0];

    if (!subsidy_credits) {
      status = 400;
      throw Error("No Subsidy Credit Found");
    }

    if (
      subsidy_credits?.credit_amount != availableCredit ||
      subsidyCreditUUID != subsidy_credits?.uuid
    ) {
      status = 400;
      throw Error("Amount Credit Not Have Same Value");
    }

    const updatedAvailableCredit = Math.max(0, availableCredit - price);

    // Calculate effective price
    const effectivePrice = Math.max(0, price - discount); // Effective price after discount

    // Calculate used credit based on the full price
    const usedCredit = Math.min(availableCredit, price);

    console.log("subsidy_credits-->", subsidy_credits);
    console.log("updatedAvailableCredit==>", updatedAvailableCredit);

    console.log("usedCredit==>", usedCredit);

    const updateSubsidyCredit: Partial<SubsidyCredit> = {
      subsidy_credit_id: subsidy_credits.subsidy_credit_id,
      credit_amount: updatedAvailableCredit,
    };

    const subsidyTransaction: Partial<SubsidyTransaction> = {
      user_id: user.user_id,
      price,
      discount_price: discount,
      credit_used: usedCredit,
      total_price: totalPrice,
      transaction_status: $Enums.TransactionStatus.COMPLETED,
    };

    const updateSubsidy: Partial<Subsidy> = {
      subsidy_id: subsidy.subsidy_id,
      amount: updatedAvailableCredit,
    };

    const transactionSubsidy = await SubsidyCreditTransactionCascade({
      subsidyCredit: updateSubsidyCredit as SubsidyCredit,
      subsidyTransaction: subsidyTransaction as SubsidyTransaction,
      subsidy: updateSubsidy as Subsidy,
    });

    // const updateSubsidyCreditProcess = await UpdateSubsidyCredit({
    //   data: updateSubsidyCredit,
    // });

    if (!transactionSubsidy) {
      status = 400;
      throw Error("Failed To Update Subsidy Credit Transaction.");
    }

    return NextResponse.json({
      updateSubsidy: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || message,
      },
      {
        status: error.statusCode || status,
      }
    );
  }
}

export async function GetSubsidyTransactionPaginationService(
  data: SubsidyTransactionPaginationRequest
) {
  let message: string = "";
  let status: number = 500;
  try {
    await SubsidyTransactionPagination(data);

    const { page, filter, startDate, endDate } = data;
    let transactions: any = [];
    let totalItems: number = 0;

    let conditionFilter: any = {};

    const filterSubsidyTypeCodeMeal = {
      // subsidies: {
      //   some: {
      //     subsidy_type: {
      //       subsidy_type_code: SubsidyTypeCode.meal,
      //     },
      //   },
      // },
    };

    if (filter) {
      conditionFilter = {
        OR: [
          {
            user: {
              employee_id: { contains: filter, mode: "insensitive" },
            },
          },
          {
            user: {
              UserDetails: {
                name: { contains: filter, mode: "insensitive" },
              },
            },
          },
          {
            user: {
              department: {
                department_name: { contains: filter, mode: "insensitive" },
              },
            },
          },
          {
            user: {
              cost_center: {
                cost_center_code: { contains: filter, mode: "insensitive" },
              },
            },
          },
          {
            user: {
              employee_category: {
                employee_category_name: {
                  contains: filter,
                  mode: "insensitive",
                },
              },
            },
          },
        ],
      };
    }

    // If conditionFilter is not empty, combine with filterSubsidyTypeCodeMeal using AND
    if (Object.keys(conditionFilter).length > 0) {
      conditionFilter = {
        AND: [
          conditionFilter, // Existing filter conditions
          filterSubsidyTypeCodeMeal, // New filter to be combined
        ],
      };
    } else {
      // If conditionFilter is empty, just use filterSubsidyTypeCodeMeal
      conditionFilter = filterSubsidyTypeCodeMeal;
    }

    const totalSubsidyTransaction: number =
      await GetCountTotalSubsidyTransaction({
        where: conditionFilter,
      });

    if (!totalSubsidyTransaction) {
      return NextResponse.json({
        totalItems,
        transactions,
      });
    }

    console.log("totalSubsidyTransaction==>", totalSubsidyTransaction);

    const getSubsidyTransaction = await GetSubsidyTransactionPagination({
      paginate: { page, totalItems: totalSubsidyTransaction },
      where: conditionFilter,
      orderBy: { field: "created_at", direction: "desc" },
      select: {
        credit_used: true,
        transaction_at: true,
        uuid: true,
        user: {
          select: {
            uuid: true,
            employee_id: true,
            UserDetails: {
              select: {
                name: true,
              },
            },
            cost_center: {
              select: {
                cost_center_code: true,
              },
            },
            department: {
              select: {
                department_code: true,
                uuid: true,
                department_name: true,
              },
            },
            employee_category: {
              select: {
                employee_category_code: true,
                employee_category_name: true,
              },
            },
          },
        },
      },

      // select: {
      //   uuid: true,
      //   active: true,
      //   created_at: true,
      //   employee_id: true,
      //   email: true,
      //   UserDetails: {
      //     select: {
      //       name: true,
      //     },
      //   },
      //   cost_center: {
      //     select: {
      //       cost_center_code: true,
      //     },
      //   },
      //   department: {
      //     select: {
      //       department_code: true,
      //       uuid: true,
      //       department_name: true,
      //     },
      //   },
      //   subsidies: {
      //     select: {
      //       applicable: true,
      //       uuid: true,
      //       subsidy_type: {
      //         select: {
      //           subsidy_type_code: true,
      //           subsidy_type_name: true,
      //           uuid: true,
      //           price: true,
      //         },
      //       },
      //     },
      //   },
      //   employee_category: {
      //     select: {
      //       employee_category_code: true,
      //       employee_category_name: true,
      //     },
      //   },
      //   access_cards: {
      //     select: {
      //       card_value: true,
      //     },
      //   },
      // },
    });

    if (!getSubsidyTransaction) {
      return NextResponse.json({
        totalItems,
        transactions,
      });
    }

    totalItems = totalSubsidyTransaction;
    transactions = getSubsidyTransaction;

    return NextResponse.json({
      transactions,
      totalItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || message,
      },
      {
        status: error.statusCode || status,
      }
    );
  }
}

// Test with dummy data.
export async function GetSubsidyTransactionReportChart(data: {
  range: string;
}) {
  let message: string = "";
  let status: number = 500;

  const filterInput = ["yearly", "monthly", "weekly", "daily"];
  try {
    const { range } = data;

    if (filterInput.indexOf(range) === -1) {
      status = 400;
      throw Error("Filter is out of the Range set");
    }

    let labels: string[] = [];
    let datasets: any = [];
    let dataValue: number[] = [];

    switch (range) {
      case "yearly": {
        labels = ["2020", "2021", "2022", "2023", "2024"];
        datasets = [
          {
            label: "Credited",
            data: [5000, 6000, 7500, 8000, 8500],
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ];
        dataValue = [5000, 6000, 7500, 8000, 8500];
        break;
      }

      case "monthly": {
        labels = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];

        datasets = [
          {
            label: "Credited",
            data: [
              500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000,
              3250,
            ],
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ];

        dataValue = [
          500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000, 3250,
        ];
        break;
      }

      case "weekly": {
        labels = ["Week 1", "Week 2", "Week 3", "Week 4"];
        datasets = [
          {
            label: "Credited",
            data: [150, 200, 250, 300],
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ];

        dataValue = [150, 200, 250, 300];
        break;
      }

      case "daily": {
        labels = [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];

        datasets = [
          {
            label: "Credited",
            data: [50, 75, 100, 125, 150, 175, 200],
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ];

        dataValue = [50, 75, 100, 125, 150, 175, 200];
        break;
      }
    }

    const chartData = {
      yearly: {
        labels: ["2020", "2021", "2022", "2023", "2024"],
        datasets: [
          {
            label: "Credited",
            data: [5000, 6000, 7500, 8000, 8500],
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
      monthly: {
        labels: [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ],
        datasets: [
          {
            label: "Credited",
            data: [
              500, 750, 1000, 1250, 1500, 1750, 2000, 2250, 2500, 2750, 3000,
              3250,
            ],
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
      weekly: {
        labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
        datasets: [
          {
            label: "Credited",
            data: [150, 200, 250, 300],
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
      daily: {
        labels: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        datasets: [
          {
            label: "Credited",
            data: [50, 75, 100, 125, 150, 175, 200],
            backgroundColor: "rgba(75, 192, 192, 0.2)",
            borderColor: "rgba(75, 192, 192, 1)",
            borderWidth: 1,
          },
        ],
      },
    };

    return NextResponse.json({
      labels,
      datasets,
      data: dataValue,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || message,
      },
      {
        status: error.statusCode || status,
      }
    );
  }
}

export async function DownloadReportSubsidyTransaction(
  data: SubsidyTransactionDownloadReportRequest
) {
  let message: string = "";
  let status: number = 500;
  try {
    await SubsidyTransactionReportDownload(data);

    const { startDate, endDate, employees_id } = data;

    const subsidyTransaction: DownloadReportSubsidyTransactionResult[] =
      (await GetFilteredTransactions({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        employees_id: employees_id ? employees_id : [],
      })) as DownloadReportSubsidyTransactionResult[];

    if (!subsidyTransaction || subsidyTransaction.length < 0) {
      status = 400;
      throw Error("SubsidyT ransaction is out of the Range set");
    }

    const HEADER_ORDER_LIST: string[][] = [
      [
        "Name",
        "Employee ID",
        "Department Name",
        "Value Stream",
        "Employee Category Name",
        "Credit Used (RM)",
        "Transaction Date",
        "Transaction Time",
        "Cashier In Charged",
      ],
    ];
    const writeExcel = ConvertExcel(HEADER_ORDER_LIST, subsidyTransaction);

    return new Response(writeExcel, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="report.xlsx"',
        "Content-Type": FileMimeType.XLSX,
      },
    });

    return NextResponse.json({
      subsidyTransaction,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || message,
      },
      {
        status: error.statusCode || status,
      }
    );
  }
}

type CreditRunOptions = {
  overrideAmount?: number;
  source: "CRON" | "MANUAL";
  scheduleId?: number | null;
  triggeredByUserId?: number | null;
  runKey?: string;
  now?: Date;
};

// Keep the credit replacement, subsidy amount updates, and run log atomic.
// The unique run key is inserted first, so concurrent cron workers cannot
// distribute the same scheduled occurrence twice.
async function distributeCredits(options: CreditRunOptions) {
  const { overrideAmount, source, scheduleId, triggeredByUserId, runKey } = options;
  const now = options.now || new Date();

  if (overrideAmount !== undefined && (!Number.isFinite(overrideAmount) || overrideAmount <= 0)) {
    throw new Error("Credit amount must be greater than zero");
  }

  return prisma.$transaction(async (tx) => {
    // Serialize automatic and manual balance replacement across server processes.
    // This PostgreSQL advisory lock is released on commit or rollback.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(604, 8668) IS NULL AS locked`;

    if (runKey) {
      // Recheck after acquiring the lock: an operator may have changed the
      // active routine while this worker was waiting to distribute credits.
      const currentRoutines = await tx.subsidySchedule.findMany({
        where: { schedule_type: "ROUTINE", active: true, deleted_at: null },
        select: {
          subsidy_schedule_id: true,
          routine_frequency: true,
          trigger_time: true,
          day_of_week: true,
          day_of_month: true,
          amount: true,
        },
        take: 2,
      });
      if (currentRoutines.length > 1) throw new Error("Multiple active routines found");
      const stillDue = getDueCreditRun(currentRoutines[0] || null, now);
      if (!stillDue || stillDue.runKey !== runKey || stillDue.scheduleId !== (scheduleId ?? null) || stillDue.amount !== overrideAmount) {
        throw new Error("The active routine changed before the credit run began");
      }

      await tx.subsidyScheduleLog.create({
        data: {
          run_key: runKey,
          subsidy_schedule_id: scheduleId ?? null,
          triggered_by_source: source,
          amount: 0,
          status: "PENDING",
        },
      });
    }

    const subsidies = await tx.subsidy.findMany({
      where: {
        active: true,
        OR: [{ end_date: { gte: now } }, { end_date: null }],
      },
      select: {
        user_id: true,
        subsidy_id: true,
        applicable: true,
        subsidy_type: { select: { price: true } },
      },
    });

    if (subsidies.length === 0) throw new Error("No one is in subsidy");

    const updates = subsidies.map((subsidy) => ({
      subsidy_id: subsidy.subsidy_id,
      user_id: subsidy.user_id,
      amount: subsidy.applicable
        ? (overrideAmount ?? subsidy.subsidy_type?.price ?? 0)
        : 0,
    }));
    const totalAmount = updates.reduce((sum, subsidy) => sum + subsidy.amount, 0);

    // Preserve the old job's balance-replacement behavior, but do it inside
    // the same transaction as the new credits and audit log.
    await tx.subsidyCredit.updateMany({ data: { active: false } });
    const updated = await UpdateSubsidiesInBulk({
      subsidies: updates as Subsidy[],
      prismaTransaction: tx,
    });
    if (updated !== updates.length) throw new Error("Failed to update all subsidies");

    const created = await tx.subsidyCredit.createMany({
      data: updates.map((subsidy) => ({
        user_id: subsidy.user_id,
        subsidy_id: subsidy.subsidy_id,
        credit_amount: subsidy.amount,
      })),
    });
    if (created.count !== updates.length) throw new Error("Failed to create all subsidy credits");

    const logData = {
      subsidy_schedule_id: scheduleId ?? null,
      triggered_by_source: source,
      triggered_by_user_id: triggeredByUserId ?? null,
      amount: totalAmount,
      users_affected_count: created.count,
      status: "SUCCESS",
      notes: `${source === "CRON" ? "Automated" : "Manual"} credit trigger completed for ${created.count} users.`,
    } as const;

    if (runKey) {
      await tx.subsidyScheduleLog.update({ where: { run_key: runKey }, data: logData });
    } else {
      await tx.subsidyScheduleLog.create({ data: logData });
    }

    return { usersAffected: created.count, totalAmount };
  }, { timeout: 30000, maxWait: 30000 });
}

export async function TriggerCreditService(overrideAmount?: number) {
  try {
    const result = await distributeCredits({ overrideAmount, source: "MANUAL" });
    return NextResponse.json({ message: true, ...result });
  } catch (error: any) {
    console.error("TriggerCreditService error:", error);
    return NextResponse.json({ message: error.message || "Credit trigger failed" }, { status: 500 });
  }
}

export async function RunDueCreditScheduleService(now = new Date()) {
  const activeRoutines = await prisma.subsidySchedule.findMany({
    where: { schedule_type: "ROUTINE", active: true, deleted_at: null },
    select: {
      subsidy_schedule_id: true,
      routine_frequency: true,
      trigger_time: true,
      day_of_week: true,
      day_of_month: true,
      amount: true,
    },
    take: 2,
  });

  if (activeRoutines.length > 1) {
    throw new Error("Multiple active routines found; credit distribution skipped");
  }

  const dueRun = getDueCreditRun(activeRoutines[0] || null, now);
  if (!dueRun) return { status: "NOT_DUE" as const };

  try {
    const result = await distributeCredits({
      overrideAmount: dueRun.amount,
      source: "CRON",
      scheduleId: dueRun.scheduleId,
      runKey: dueRun.runKey,
      now,
    });
    return { status: "COMPLETED" as const, runKey: dueRun.runKey, ...result };
  } catch (error) {
    const uniqueTarget = error instanceof Prisma.PrismaClientKnownRequestError
      ? error.meta?.target
      : undefined;
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002" &&
      (Array.isArray(uniqueTarget)
        ? uniqueTarget.includes("run_key")
        : typeof uniqueTarget === "string" && uniqueTarget.includes("run_key"))
    ) {
      return { status: "ALREADY_COMPLETED" as const, runKey: dueRun.runKey };
    }
    throw error;
  }
}

export async function GetSubsidyTypePaginationService(
  data: SubsidyTypePaginationRequest
) {
  let message: string = "";
  let status: number = 500;
  try {
    await SubsidyTypePagination(data);

    const { page, filter } = data;
    let transactions: any = [];
    let totalItems: number = 0;

    let conditionFilter: any = {};

    const filterSubsidyTypeCodeMeal = {
      // subsidies: {
      //   some: {
      //     subsidy_type: {
      //       subsidy_type_code: SubsidyTypeCode.meal,
      //     },
      //   },
      // },
    };

    if (filter) {
      conditionFilter = {
        OR: [
          {
            subsidy_type_name: { contains: filter, mode: "insensitive" },
          },
        ],
      };
    }

    // If conditionFilter is not empty, combine with filterSubsidyTypeCodeMeal using AND
    if (Object.keys(conditionFilter).length > 0) {
      conditionFilter = {
        AND: [
          conditionFilter, // Existing filter conditions
          filterSubsidyTypeCodeMeal, // New filter to be combined
        ],
      };
    } else {
      // If conditionFilter is empty, just use filterSubsidyTypeCodeMeal
      conditionFilter = filterSubsidyTypeCodeMeal;
    }

    const totalSubsidyType: number = await GetCountTotalSubsidyType({
      where: conditionFilter,
    });

    if (!totalSubsidyType) {
      return NextResponse.json({
        totalItems,
        transactions,
      });
    }

    console.log("totalSubsidyTransaction==>", totalSubsidyType);

    const getSubsidyType = await GetSubsidyTypePagination({
      paginate: { page, totalItems: totalSubsidyType },
      where: conditionFilter,
      orderBy: { field: "created_at", direction: "desc" },
    });

    if (!getSubsidyType) {
      return NextResponse.json({
        totalItems,
        transactions,
      });
    }

    totalItems = totalSubsidyType;
    transactions = getSubsidyType;

    return NextResponse.json({
      transactions,
      totalItems,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || message,
      },
      {
        status: error.statusCode || status,
      }
    );
  }
}

export async function UpdateSubsidyTypeService(data: Partial<SubsidyType>) {
  let message: string = "";
  let status: number = 500;
  try {
    await UpdateSubsidyTypeValidation(data);

    const { uuid, subsidy_type_code, subsidy_type_name, price } = data;
    const subsidyType: Partial<SubsidyType> | null = await GetSubsidyTypeSingle(
      {
        where: {
          uuid,
        },
      }
    );

    if (!subsidyType) {
      status = 400;
      throw Error("Subsidy Type not Found");
    }

    const updateSubsidyType: Partial<SubsidyType> = {
      subsidy_type_id: subsidyType.subsidy_type_id,
      subsidy_type_name: subsidy_type_name,
      price: parseFloat(String(price)),
    };

    const updateSubsidyTypeTransaction = await UpdateSubsidyTypeSingle({
      data: updateSubsidyType,
    });

    if (!updateSubsidyTypeTransaction) {
      status = 400;
      throw Error("Failed to Update Subsidy Type");
    }

    return NextResponse.json({
      message: "Successfully Update Subsidy",
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      {
        message: error.message || message,
      },
      {
        status: error.statusCode || status,
      }
    );
  }
}

export async function UpdateSubsidyCreditRealTimeService(
  data: UpdateSubsidyCreditRequest
) {
  let message: string = "";
  let status: number = 500;
  try {
    await UpdateSubsidyCreditRealTimeValidation(data);

    const { amount, user_uuid, subsidy_uuid } = data;

    const subsidyCredit: Partial<SubsidyCredit | null> =
      await GetSubsidyCreditSingle({
        where: {
          active: true,
          subsidy: {
            uuid: subsidy_uuid,
            user: {
              uuid: user_uuid,
            },
          },
        },
        select: {
          subsidy_credit_id: true,
          credit_amount: true,
          subsidy_id: true,
          subsidy: {
            select: {
              amount: true,
            },
          },
        },
      });

    if (!subsidyCredit) {
      status = 400;
      throw Error("Subsidy Credit not Found");
    }

    const updateSubsidy: Partial<Subsidy> = {
      subsidy_id: subsidyCredit.subsidy_id,
      amount,
    };

    const updateSubsidyCredit: Partial<SubsidyCredit> = {
      subsidy_credit_id: subsidyCredit.subsidy_credit_id,
      credit_amount: amount,
    };

    const updateSubsidyCascade = await SubsidyCreditCascade({
      subsidy: updateSubsidy as Subsidy,
      subsidyCredit: updateSubsidyCredit as SubsidyCredit,
    });

    if (!updateSubsidyCascade) {
      status = 400;
      throw Error("Subsidy Cannot Be Create");
    }

    console.log("Subsidy Credit==>", subsidyCredit);
    return NextResponse.json({
      message: "Successfully Update",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || message,
      },
      {
        status: error.statusCode || status,
      }
    );
  }
}

export async function CreateSubsidyTransactionServiceAuth(
  data: SubsidySubmitPrice,
  user_details: User
) {
  let message: string = "";
  let status: number = 500;
  try {
    await EmployeeSubmitPriceValidation(data);

    console.log("USer===>", user_details);
    const checkCashier = await GetUserSingle({
      where: {
        user_id: user_details.user_id,
        department: {
          department_code: "cashier",
        },
      },
    });

    if (!checkCashier) {
      status = 400;
      throw Error("Transaction only can be done from Cashier");
    }
    const {
      totalPrice,
      price,
      availableCredit,
      discount,
      employee_id,
      subsidyCreditUUID,
    } = data;

    console.log("DATA==>", data);
    const user = await GetUserSingle({
      where: {
        employee_id,
        subsidies: {
          some: {
            AND: [
              {
                subsidy_type: {
                  subsidy_type_code: SubsidyTypeCode.meal,
                },
              },
              {
                subsidy_credits: {
                  some: {
                    active: true,
                    uuid: {
                      in: [subsidyCreditUUID],
                    },
                  },
                },
              },
              {
                OR: [
                  { end_date: null },
                  { end_date: { gt: new Date() } },
                ],
              },
            ],
          },
        }
        
      },

      select: {
        user_id: true,
        subsidies: {
          select: {
            subsidy_id: true,
            subsidy_credits: {
              where: {
                active: true,
              },
              select: {
                subsidy_credit_id: true,
                credit_amount: true,
                uuid: true,
                active: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      status = 400;
      throw Error("Credit Has Been Finished/ Expired");
    }

    const { subsidies, ...UserWihoutSubsidy } = user as any;

    const subsidiesCheck: Subsidy[] = subsidies as Subsidy[];

    if (subsidiesCheck.length !== 1) {
      status = 400;
      throw Error("Wrong Setup For Subsidy");
    }

    const subsidy: Subsidy = subsidiesCheck[0];

    const SubsidyCredits: SubsidyCredit[] = [];

    subsidiesCheck.forEach((subsidy) => {
      // Type assertion to access subsidy_credits
      const checkSubsidyCredits: SubsidyCredit[] = (subsidy as any)
        ?.subsidy_credits;

      console.log("checkSubsidyCredits===>", checkSubsidyCredits);

      // Check if there is exactly one credit
      if (checkSubsidyCredits.length !== 1) {
        throw new Error("Wrong Setup Subsidy Credit");
      }

      // Push the single credit to the SubsidyCredits array
      SubsidyCredits.push(checkSubsidyCredits[0]);
    });

    if (SubsidyCredits.length !== 1) {
      status = 400;
      throw Error("Wrong Setup For Subsidy Credit");
    }

    const subsidy_credits: Partial<SubsidyCredit> = SubsidyCredits[0];

    if (!subsidy_credits) {
      status = 400;
      throw Error("No Subsidy Credit Found");
    }

    if (
      subsidy_credits?.credit_amount != availableCredit ||
      subsidyCreditUUID != subsidy_credits?.uuid
    ) {
      status = 400;
      throw Error("Amount Credit Not Have Same Value");
    }

    const updatedAvailableCredit = Math.max(0, availableCredit - price);

    // Calculate used credit based on the full price
    const usedCredit = Math.min(availableCredit, price);

    console.log("subsidy_credits-->", subsidy_credits);
    console.log("updatedAvailableCredit==>", updatedAvailableCredit);

    console.log("usedCredit==>", usedCredit);

    const updateSubsidyCredit: Partial<SubsidyCredit> = {
      subsidy_credit_id: subsidy_credits.subsidy_credit_id,
      credit_amount: updatedAvailableCredit,
    };

    const subsidyTransaction: Partial<SubsidyTransaction> = {
      user_id: user.user_id,
      price,
      discount_price: discount,
      credit_used: usedCredit,
      total_price: totalPrice,
      transaction_status: $Enums.TransactionStatus.COMPLETED,
      created_by_user_id: user_details.user_id,
    };

    const updateSubsidy: Partial<Subsidy> = {
      subsidy_id: subsidy.subsidy_id,
      amount: updatedAvailableCredit,
    };

    const transactionSubsidy = await SubsidyCreditTransactionCascade({
      subsidyCredit: updateSubsidyCredit as SubsidyCredit,
      subsidyTransaction: subsidyTransaction as SubsidyTransaction,
      subsidy: updateSubsidy as Subsidy,
    });

    // const updateSubsidyCreditProcess = await UpdateSubsidyCredit({
    //   data: updateSubsidyCredit,
    // });

    if (!transactionSubsidy) {
      status = 400;
      throw Error("Failed To Update Subsidy Credit Transaction.");
    }

    return NextResponse.json({
      updateSubsidy: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || message,
      },
      {
        status: error.statusCode || status,
      }
    );
  }
}

export async function CreateSubsidyTransactionServiceSocketAuth(
  data: SubsidySubmitPrice,
  user_details: User
) {
  let message: string = "";
  let status: number = 500;
  try {
    await EmployeeSubmitPriceValidation(data);

    console.log("USer===>", user_details);
    const checkCashier = await GetUserSingle({
      where: {
        user_id: user_details.user_id,
        department: {
          department_code: "cashier",
        },
      },
    });

    if (!checkCashier) {
      status = 400;
      throw Error("Transaction only can be done from Cashier");
    }
    const {
      totalPrice,
      price,
      availableCredit,
      discount,
      employee_id,
      subsidyCreditUUID,
    } = data;

    console.log("DATA==>", data);
    const user = await GetUserSingle({
      where: {
        employee_id,
        subsidies: {
          some: {
            subsidy_type: {
              subsidy_type_code: SubsidyTypeCode.meal,
            },
            subsidy_credits: {
              some: {
                active: true,
                uuid: {
                  in: [subsidyCreditUUID],
                },
              },
            },
            OR: [
              { end_date: null }, // Include subsidies where end_date is not set
              { end_date: { gt: new Date() } }, // Include subsidies where end_date is greater than the current time
            ],
          },
        },
      },

      select: {
        user_id: true,
        subsidies: {
          select: {
            subsidy_id: true,
            subsidy_credits: {
              where: {
                active: true,
              },
              select: {
                subsidy_credit_id: true,
                credit_amount: true,
                uuid: true,
                active: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      status = 400;
      throw Error("Credit Has Been Finished/ Expired");
    }

    const { subsidies, ...UserWihoutSubsidy } = user as any;

    const subsidiesCheck: Subsidy[] = subsidies as Subsidy[];

    if (subsidiesCheck.length !== 1) {
      status = 400;
      throw Error("Wrong Setup For Subsidy");
    }

    const subsidy: Subsidy = subsidiesCheck[0];

    const SubsidyCredits: SubsidyCredit[] = [];

    subsidiesCheck.forEach((subsidy) => {
      // Type assertion to access subsidy_credits
      const checkSubsidyCredits: SubsidyCredit[] = (subsidy as any)
        ?.subsidy_credits;

      console.log("checkSubsidyCredits===>", checkSubsidyCredits);

      // Check if there is exactly one credit
      if (checkSubsidyCredits.length !== 1) {
        throw new Error("Wrong Setup Subsidy Credit");
      }

      // Push the single credit to the SubsidyCredits array
      SubsidyCredits.push(checkSubsidyCredits[0]);
    });

    if (SubsidyCredits.length !== 1) {
      status = 400;
      throw Error("Wrong Setup For Subsidy Credit");
    }

    const subsidy_credits: Partial<SubsidyCredit> = SubsidyCredits[0];

    if (!subsidy_credits) {
      status = 400;
      throw Error("No Subsidy Credit Found");
    }

    if (
      subsidy_credits?.credit_amount != availableCredit ||
      subsidyCreditUUID != subsidy_credits?.uuid
    ) {
      status = 400;
      throw Error("Amount Credit Not Have Same Value");
    }

    const updatedAvailableCredit = Math.max(0, availableCredit - price);

    // Calculate used credit based on the full price
    const usedCredit = Math.min(availableCredit, price);

    console.log("subsidy_credits-->", subsidy_credits);
    console.log("updatedAvailableCredit==>", updatedAvailableCredit);

    console.log("usedCredit==>", usedCredit);

    const updateSubsidyCredit: Partial<SubsidyCredit> = {
      subsidy_credit_id: subsidy_credits.subsidy_credit_id,
      credit_amount: updatedAvailableCredit,
    };

    const subsidyTransaction: Partial<SubsidyTransaction> = {
      user_id: user.user_id,
      price,
      discount_price: discount,
      credit_used: usedCredit,
      total_price: totalPrice,
      transaction_status: $Enums.TransactionStatus.COMPLETED,
      created_by_user_id: user_details.user_id,
    };

    const updateSubsidy: Partial<Subsidy> = {
      subsidy_id: subsidy.subsidy_id,
      amount: updatedAvailableCredit,
    };

    const transactionSubsidy = await SubsidyCreditTransactionCascade({
      subsidyCredit: updateSubsidyCredit as SubsidyCredit,
      subsidyTransaction: subsidyTransaction as SubsidyTransaction,
      subsidy: updateSubsidy as Subsidy,
    });

    // const updateSubsidyCreditProcess = await UpdateSubsidyCredit({
    //   data: updateSubsidyCredit,
    // });

    if (!transactionSubsidy) {
      status = 400;
      throw Error("Failed To Update Subsidy Credit Transaction.");
    }

    return {
      status: 200,
      updateSubsidy: true,
    };
  } catch (error: any) {
    return {
      message: error.message || message,
      status: error.statusCode || status,
    };
  }
}

export async function GetSubsidySchedulesService() {
  try {
    const schedules = await GetSubsidySchedules({
      where: {},
      select: {
        subsidy_schedule_id: true,
        uuid: true,
        title: true,
        schedule_type: true,
        routine_frequency: true,
        cron_expression: true,
        trigger_time: true,
        day_of_week: true,
        day_of_month: true,
        start_datetime: true,
        end_datetime: true,
        amount: true,
        active: true,
        created_at: true,
        subsidy_type: {
          select: {
            subsidy_type_id: true,
            subsidy_type_name: true,
            subsidy_type_code: true,
          },
        },
      },
    });

    return NextResponse.json({ schedules });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Failed to fetch schedules" }, { status: 500 });
  }
}

export async function CreateSubsidyScheduleService(data: any) {
  try {
    const { code, uuid, start_datetime, end_datetime, ...rest } = data;
    const cleanedData: any = {
      ...rest,
      amount: parseFloat(data.amount) || 0,
      day_of_week: data.day_of_week ? parseInt(data.day_of_week) : null,
      day_of_month: data.day_of_month ? parseInt(data.day_of_month) : null,
      start_datetime: start_datetime ? new Date(start_datetime) : null,
      end_datetime: end_datetime ? new Date(end_datetime) : null,
      active: data.active !== undefined ? data.active : true,
    };
    
    if (cleanedData.schedule_type === 'ROUTINE') {
      cleanedData.start_datetime = null;
      cleanedData.end_datetime = null;
      if (cleanedData.active) assertValidRoutine({ subsidy_schedule_id: 0, ...cleanedData });
    }

    const schedule = await prisma.$transaction(async (tx) => {
      if (cleanedData.schedule_type === 'ROUTINE' && cleanedData.active) {
        await tx.subsidySchedule.updateMany({
          where: { schedule_type: 'ROUTINE', active: true, deleted_at: null },
          data: { active: false },
        });
      }
      return tx.subsidySchedule.create({ data: cleanedData });
    });
    return NextResponse.json({ message: "Schedule created successfully", schedule });
  } catch (error: any) {
    console.error("CreateSubsidySchedule error:", error);
    return NextResponse.json({ message: error.message || "Error creating schedule" }, { status: 500 });
  }
}

export async function UpdateSubsidyScheduleService(data: any) {
  try {
    const { code, start_datetime, end_datetime, ...rest } = data;
    const cleanedData: any = {
      ...rest,
      amount: parseFloat(data.amount) || 0,
      day_of_week: data.day_of_week ? parseInt(data.day_of_week) : null,
      day_of_month: data.day_of_month ? parseInt(data.day_of_month) : null,
      start_datetime: start_datetime ? new Date(start_datetime) : null,
      end_datetime: end_datetime ? new Date(end_datetime) : null,
    };

    const { uuid, ...updateData } = cleanedData;
    if (!uuid) return NextResponse.json({ message: "Schedule UUID is required" }, { status: 400 });

    await prisma.$transaction(async (tx) => {
      const existing = await tx.subsidySchedule.findFirst({ where: { uuid, deleted_at: null } });
      if (!existing) throw new Error("Schedule not found");

      const next = { ...existing, ...updateData };
      if (next.schedule_type === 'ROUTINE') {
        updateData.start_datetime = null;
        updateData.end_datetime = null;
        if (next.active) {
          assertValidRoutine(next);
          await tx.subsidySchedule.updateMany({
            where: { schedule_type: 'ROUTINE', active: true, deleted_at: null, subsidy_schedule_id: { not: existing.subsidy_schedule_id } },
            data: { active: false },
          });
        }
      }

      await tx.subsidySchedule.update({
        where: { subsidy_schedule_id: existing.subsidy_schedule_id },
        data: updateData,
      });
    });
    return NextResponse.json({ message: "Schedule updated successfully" });
  } catch (error: any) {
    console.error("UpdateSubsidySchedule error:", error);
    return NextResponse.json({ message: error.message || "Error updating schedule" }, { status: 500 });
  }
}

export async function ToggleSubsidyScheduleActiveService(scheduleUuid: string, active: boolean) {
  try {
    const targetSchedule = await prisma.$transaction(async (tx) => {
      const target = await tx.subsidySchedule.findFirst({
        where: { uuid: scheduleUuid, deleted_at: null },
      });
      if (!target) return null;

      if (active && target.schedule_type === 'ROUTINE') {
        assertValidRoutine(target);
        await tx.subsidySchedule.updateMany({
          where: { schedule_type: 'ROUTINE', active: true, deleted_at: null, subsidy_schedule_id: { not: target.subsidy_schedule_id } },
          data: { active: false },
        });
      }

      return tx.subsidySchedule.update({
        where: { subsidy_schedule_id: target.subsidy_schedule_id },
        data: { active },
      });
    });

    if (!targetSchedule) return NextResponse.json({ message: "Schedule not found" }, { status: 404 });

    return NextResponse.json({
      message: `Schedule "${targetSchedule.title}" ${active ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error: any) {
    console.error("ToggleSubsidyScheduleActive error:", error);
    return NextResponse.json({ message: error.message || "Error toggling schedule active state" }, { status: 500 });
  }
}

export async function DeleteSubsidyScheduleService(uuid: string) {
  try {
    await DeleteSubsidySchedule(uuid);
    return NextResponse.json({ message: "Schedule deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Error deleting schedule" }, { status: 500 });
  }
}

export async function GetSubsidyScheduleLogsService(params?: { page?: number; pageSize?: number }) {
  try {
    const result = await GetSubsidyScheduleLogs(params);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || "Error fetching schedule logs" }, { status: 500 });
  }
}

export async function ManualTriggerScheduleService(scheduleUuid: string, user?: User) {
  try {
    const schedule = await prisma.subsidySchedule.findFirst({
      where: { uuid: scheduleUuid, active: true, deleted_at: null },
    });

    if (!schedule) {
      return NextResponse.json({ message: "Schedule not found" }, { status: 404 });
    }

    const result = await distributeCredits({
      overrideAmount: schedule.amount,
      source: "MANUAL",
      scheduleId: schedule.subsidy_schedule_id,
      triggeredByUserId: user?.user_id,
    });
    const klTime = new Date().toLocaleString("en-US", { timeZone: "Asia/Kuala_Lumpur" });
    return NextResponse.json({
      message: `Manual trigger executed successfully for "${schedule.title}" at ${klTime} (KL Time).`,
      ...result,
    });
  } catch (error: any) {
    console.error("ManualTriggerSchedule error:", error);
    return NextResponse.json({ message: error.message || "Error triggering schedule" }, { status: 500 });
  }
}
