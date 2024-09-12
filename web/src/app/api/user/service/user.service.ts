import { UserPaginationRequest } from "@/_Common/interface/user.interface";
import { UserPaginationValidation } from "@/_Common/validation/user.validation";
import { NextResponse } from "next/server";
import { GetTotalUser, GetUserPagination } from "../model/user.model";
import { PaginationData } from "../../../../_Common/interface/pagination.interface";
export async function UserPaginationService(data: UserPaginationRequest) {
  let message: string = "";
  let status: number = 500;
  try {
    await UserPaginationValidation(data);

    const { page, filter } = data;

    let employees: any = [];
    let totalItems: number = 0;

    let condtionFilter: any = {};

    if (filter) {
      condtionFilter = {
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

    const totalUser: number = await GetTotalUser({
      where: condtionFilter,
    });

    if (!totalUser) {
      return NextResponse.json({
        totalItems,
        employees,
      });
    }

    const getUser = await GetUserPagination({
      paginate: { page, totalItems: totalUser },
      where: condtionFilter,
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
          }
        },
        // subsidies: {
        //   select: {

        //   }
        // }
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
