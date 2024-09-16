import {
  SubsidyEmployeeUpdate,
  SubsidySubmitPrice,
  SubsidyTransactionDownloadReportRequest,
  SubsidyTransactionPaginationRequest,
  DownloadReportSubsidyTransactionResult,
} from "@/_Common/interface/subsidy.interface";
import {
  EmployeeSubmitPriceValidation,
  EmployeeUpdateSubsidyValidation,
  SubsidyTransactionPagination,
  SubsidyTransactionReportDownload,
} from "@/_Common/validation/subsidy.validation";
import {
  $Enums,
  Prisma,
  Subsidy,
  SubsidyCredit,
  SubsidyTransaction,
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
} from "../model/subsidy.model";
import { GetUserSingle } from "../../user/model/user.model";
import { SubsidyTypeCode } from "@/_Common/enum/subsidy-type.enum";
import { ConvertExcel } from "@/_Common/function/SpreedSheet";

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

    const user = await GetUserSingle({
      where: {
        employee_id,
        subsidies: {
          some: {
            applicable: true,
            subsidy_type: {
              subsidy_type_code: SubsidyTypeCode.meal,
            },
            subsidy_credits: {
              some: {
                // credit_amount: {
                //   gt: 0, // Check if credit_amount is greater than 0
                // },
                uuid: {
                  in: [subsidyCreditUUID], // Filter by specific UUID or an array of UUIDs
                },
              },
            },
          },
        },
      },
      select: {
        user_id: true,
        subsidies: {
          select: {
            subsidy_id: true,
            subsidy_credits: {
              select: {
                subsidy_credit_id: true,
                credit_amount: true,
                uuid: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      status = 400;
      throw Error("Credit Has Been Finished");
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

    console.log("subsidy_credits-->", subsidy_credits);
    console.log("updatedAvailableCredit==>", updatedAvailableCredit);

    const updateSubsidyCredit: Partial<SubsidyCredit> = {
      subsidy_credit_id: subsidy_credits.subsidy_credit_id,
      credit_amount: updatedAvailableCredit,
    };

    const subsidyTransaction: Partial<SubsidyTransaction> = {
      user_id: user.user_id,
      price,
      discount_price: discount,
      credit_used: availableCredit,
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

    const { startDate, endDate } = data;

    const subsidyTransaction: DownloadReportSubsidyTransactionResult[] =
      (await GetFilteredTransactions({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
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
      ],
    ];
    const writeExcel = ConvertExcel(HEADER_ORDER_LIST, subsidyTransaction);

    return new Response(writeExcel, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="report.xlsx"',
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
