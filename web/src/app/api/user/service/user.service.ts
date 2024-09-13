import {
  CreateUpdateUser,
  ScanCheckEmployeeID,
  UserPaginationRequest,
} from "@/_Common/interface/user.interface";
import {
  CreateUpdateEmployeeValidation,
  ScanEmployeeIDValidation,
  UserPaginationValidation,
} from "@/_Common/validation/user.validation";
import { NextResponse } from "next/server";
import {
  CreateUserNUserDetailsCascade,
  GetTotalUser,
  GetUserPagination,
  GetUserSingle,
} from "../model/user.model";
import { PaginationData } from "../../../../_Common/interface/pagination.interface";
import { SubsidyTypeCode } from "@/_Common/enum/subsidy-type.enum";
import { decrypt } from "@/_Common/function/Hashing";
import {
  Country,
  Department,
  Role,
  Subsidy,
  SubsidyCredit,
  SubsidyType,
  User,
  UserDetails,
} from "@prisma/client";
import { GetRoleSingle } from "../../role/model/role.model";
import { RoleCode } from "@/_Common/enum/role.enum";
import {
  GetDepartmentLists,
  GetDepartmentSingle,
} from "../../department/model/department.model";
import {
  CreateSubsidy_4User,
  GetSubsidyCreditSingle,
  GetSubsidySingle,
  GetSubsidyTypeSingle,
} from "../../subsidy/model/subsidy.model";
import { hashPassword } from "../../auth/model/auth.model";

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
        email: true,
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

    await ScanEmployeeIDValidation({ employeeID: employee_id });

    const user = await GetUserSingle({
      where: {
        employee_id,
        subsidies: {
          some: {
            applicable: true,
            subsidy_type: {
              subsidy_type_code: SubsidyTypeCode.meal,
            },
          },
        },
      },
      select: {
        user_id: true,
        UserDetails: {
          select: {
            name: true,
          },
        },
        subsidies: {
          select: {
            subsidy_id: true,
          },
        },
      },
    });

    if (!user) {
      status = 400;
      throw Error("Not Eligable For Subsidy Meal");
    }

    const subsidyCredit: Partial<SubsidyCredit> = (await GetSubsidyCreditSingle(
      {
        where: {
          user_id: user?.user_id,
          subsidy_id: (user as any)?.subsidies?.subsidy_id,
          active: true,
        },
      }
    )) as Partial<SubsidyCredit>;

    if (!subsidyCredit) {
      status = 400;
      throw Error("No Subsidy Credit Found");
    }

    return NextResponse.json({
      employee_name: (user as any)?.UserDetails?.name,
      available_credit: subsidyCredit.credit_amount,
      subsidyCreditUUID: subsidyCredit.uuid,
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

export async function CreateEmployee(data: CreateUpdateUser) {
  let message: string = "";
  let status: number = 500;
  try {
    await CreateUpdateEmployeeValidation(data);

    const {
      first_name,
      last_name,
      employee_id,
      department_name,
      email,
      password,
      confirmPassword,
    } = data;

    if (!password || !confirmPassword) {
      status = 400;
      throw Error("Password Need To Create Employee");
    }

    const hashpassword: string | null = await hashPassword(password);

    if (!hashpassword) {
      status = 400;
      throw Error("Password is Empty");
    }

    const role: Partial<Role> = (await GetRoleSingle({
      where: {
        role_code: RoleCode.employee,
      },
    })) as Partial<Role>;

    if (!role) {
      status = 400;
      throw Error("Role not Found");
    }

    const department: Partial<Department> = (await GetDepartmentSingle({
      where: {
        department_name,
      },
    })) as Partial<Department>;

    if (!department) {
      status = 400;
      throw Error("Department not Found");
    }

    const subsidyType: Partial<SubsidyType> = (await GetSubsidyTypeSingle({
      where: {
        subsidy_type_code: SubsidyTypeCode.meal,
      },
    })) as Partial<SubsidyType>;

    if (!subsidyType) {
      status = 400;
      throw Error("Subsidy Meal not Found");
    }

    const name: string = `${first_name} ${last_name}`;

    const user: Partial<User> = {
      email,
      employee_id,
      password_hash: hashpassword,
      role_id: role.role_id,
      department_id: department.department_id,
      is_email_verified: true,
      is_acc_verify: true,
      active: true,
    };

    const userDetails: Partial<UserDetails> = {
      name,
      first_name,
      last_name,
    };

    const createUser = await CreateUserNUserDetailsCascade({
      user: user as User,
      userDetails: userDetails as UserDetails,
    });

    if (!createUser || createUser.length < 0) {
      status = 400;
      throw Error("Failed To Create Employee");
    }

    const SubsidyUser: Partial<Subsidy> = {
      subsidy_type_id: subsidyType.subsidy_type_id,
      user_id: createUser[0]?.user_id,
    };

    const createSubsidyUser: any = await CreateSubsidy_4User({
      data: SubsidyUser as Subsidy,
    });

    if (!createSubsidyUser) {
      status = 400;
      throw Error("Failed To Assign Subsidy Meal");
    }

    return NextResponse.json({
      message: "Successfully Create New Employee",
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
