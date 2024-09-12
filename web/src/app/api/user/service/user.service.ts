import {
  ScanCheckEmployeeID,
  UserPaginationRequest,
} from "@/_Common/interface/user.interface";
import {
  ScanEmployeeID,
  UserPaginationValidation,
} from "@/_Common/validation/user.validation";
import { NextResponse } from "next/server";
import {
  GetTotalUser,
  GetUserPagination,
  GetUserSingle,
} from "../model/user.model";
import { PaginationData } from "../../../../_Common/interface/pagination.interface";
import { SubsidyTypeCode } from "@/_Common/enum/subsidy-type.enum";
import { decrypt } from "@/_Common/function/Hashing";

export async function UserPaginationService(data: UserPaginationRequest) {
  let message: string = "";
  let status: number = 500;
  try {
    await UserPaginationValidation(data);

    const { page, filter } = data;

    let employees: any = [];
    let totalItems: number = 0;

    let conditionFilter: any = {};

    const filterSubsidyTypeCodeMeal = {
      subsidies: {
        some: {
          subsidy_type: {
            subsidy_type_code: "meal",
          },
        },
      },
    };

    if (filter) {
      conditionFilter = {
        OR: [
          { employee_id: { contains: filter } },
          {
            UserDetails: {
              name: { contains: filter },
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

    const totalUser: number = await GetTotalUser({
      where: conditionFilter,
    });

    console.log("totalUser===>", totalUser);

    if (!totalUser) {
      return NextResponse.json({
        totalItems,
        employees,
      });
    }

    const getUser = await GetUserPagination({
      paginate: { page, totalItems: totalUser },
      where: conditionFilter,
      select: {
        uuid: true,
        active: true,
        created_at: true,
        employee_id: true,
        UserDetails: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            department_code: true,
            uuid: true,
            department_name: true,
          },
        },
        subsidies: {
          select: {
            applicable: true,
            uuid: true,
            subsidy_type: {
              select: {
                subsidy_type_code: true,
                subsidy_type_name: true,
                uuid: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { field: "created_at", direction: "desc" },
    });

    if (!getUser) {
      return NextResponse.json({
        totalItems,
        employees,
      });
    }

    employees = getUser;
    totalItems = totalUser;

    return NextResponse.json({
      employees,
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

export async function ScanCheckEmployeeIDService(data: ScanCheckEmployeeID) {
  let message: string = "";
  let status: number = 500;
  try {
    const { employeeID } = data;

    const employee_id = decrypt(employeeID || "");

    await ScanEmployeeID({ employeeID: employee_id });

    const user = await GetUserSingle({
      where: {
        employee_id,
        subsidies: {
          some: {
            subsidy_type: {
              subsidy_type_code: SubsidyTypeCode.meal,
            },
          },
        },
      },
    });

    if (!user) {
      status = 400;
      throw Error("No Employee Found");
    }

    console.log("user==>", user);
    return NextResponse.json({
      message: "",
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
