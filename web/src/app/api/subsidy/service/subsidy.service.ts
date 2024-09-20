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
import {
  GetCountTotalSubsidyTransaction,
  GetSubsidySingle,
  SubsidyCreditTransactionCascade,
  UpdateSubsidy,
  UpdateSubsidyCredit,
  GetSubsidyTransactionPagination,
  GetFilteredTransactions,
  GetSubsidyLists,
  TriggerSubsidyCreditCascade,
  GetSubsidyTypePagination,
  GetCountTotalSubsidyType,
  GetSubsidyTypeSingle,
  UpdateSubsidyTypeSingle,
  GetSubsidyCreditSingle,
  SubsidyCreditCascade,
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

    const transactionSubsidy = await SubsidyCreditTransactionCascade({
      subsidyCredit: updateSubsidyCredit as SubsidyCredit,
      subsidyTransaction: subsidyTransaction as SubsidyTransaction,
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
        "Cost Center Code",
        "Employee Category Name",
        "Credit Used (RM)",
        "Transaction At",
        "Cashier In Charged"
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

export async function TriggerCreditService() {
  let message: string = "";
  let status: number = 500;
  try {
    const today = new Date();

    const subsidies: Partial<Subsidy>[] = await GetSubsidyLists({
      where: {
        active: true,
        OR: [
          {
            end_date: {
              gte: today, // End date is in the future or today
            },
          },
          {
            end_date: null, // End date is not set
          },
        ],
      },
      select: {
        user_id: true,
        subsidy_id: true,
        applicable: true,
        amount: true,
        subsidy_type: {
          select: {
            subsidy_type_id: true,
            price: true,
          },
        },
      },
    });

    if (subsidies.length < 1) {
      status = 400;
      throw Error("No One is in Subsidy");
    }

    const updateSubsidies: Partial<Subsidy>[] = subsidies.map((subsidy) => {
      return {
        subsidy_id: subsidy.subsidy_id,
        subsidy_type_id: subsidy.subsidy_type_id,
        user_id: subsidy.user_id,
        amount: subsidy.applicable ? (subsidy as any)?.subsidy_type?.price : 0,
      };
    });

    const subsidiesCredit: Partial<SubsidyCredit>[] = updateSubsidies.map(
      (subsidy) => {
        return {
          user_id: subsidy.user_id,
          subsidy_id: subsidy.subsidy_id,
          credit_amount: subsidy.amount || 0,
        };
      }
    );

    if (!subsidiesCredit || subsidiesCredit.length !== subsidies.length) {
      status = 400;
      throw Error("No One in Subsidy");
    }

    const createSubsidiesCredit = await TriggerSubsidyCreditCascade({
      subsidies: updateSubsidies as Subsidy[],
      subsidiesCredit: subsidiesCredit as SubsidyCredit[],
    });

    if (!createSubsidiesCredit || createSubsidiesCredit.length < 1) {
      status = 400;
      throw Error("Failed TO Generate Subsidy Credit");
    }

    return NextResponse.json({
      message: true,
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
      credit_amount: usedCredit,
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


    console.log("USer===>", user_details);
    const checkCashier = await GetUserSingle({
      where: {
        user_id: user_details.user_id,
        department: {
          department_code: "cashier",
        },
      },
    });

    if(!checkCashier){
      status = 400;
      throw Error("Transaction only can be done from Cashier");
    }

    const transactionSubsidy = await SubsidyCreditTransactionCascade({
      subsidyCredit: updateSubsidyCredit as SubsidyCredit,
      subsidyTransaction: subsidyTransaction as SubsidyTransaction,
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
