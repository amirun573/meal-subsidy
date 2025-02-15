import {
  CreateUpdateUser,
  CreateUserUploadExcel,
  ScanCheckEmployeeID,
  UserPaginationRequest,
  CreateUserUserDetails,
  UpdateUserUserDetails,
} from "@/_Common/interface/user.interface";
import {
  CreateUpdateEmployeeValidation,
  ScanEmployeeIDValidation,
  UpdateEmployeeStatusValidation,
  UserPaginationValidation,
} from "@/_Common/validation/user.validation";
import { NextResponse } from "next/server";
import {
  CreateUserNUserDetailsCascade,
  CreateUserNUserDetailsManyCascade,
  GetTotalUser,
  GetUserMany,
  GetUserPagination,
  GetUserSingle,
  UpdateUser,
  GetUserRawQuery,
  UpdateUserCascade,
  CreateUpdateUserCascade,
} from "../model/user.model";
import { PaginationData } from "../../../../_Common/interface/pagination.interface";
import { SubsidyTypeCode } from "@/_Common/enum/subsidy-type.enum";
import { decrypt } from "@/_Common/function/Hashing";
import {
  AccessCard,
  CostCenter,
  Country,
  Department,
  EmployeeCategory,
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
  GetCostCenterLists,
  GetCostCenterSingle,
  GetDepartmentLists,
  GetDepartmentSingle,
  GetEmployeeCategoryLists,
  GetEmployeeCategorySingle,
} from "../../department/model/department.model";
import {
  CreateSubsidyMany,
  CreateSubsidy_4User,
  GetSubsidyCreditSingle,
  GetSubsidySingle,
  GetSubsidyTypeSingle,
  UpdateSubsidy,
} from "../../subsidy/model/subsidy.model";
import { hashPassword } from "../../auth/model/auth.model";
import { utils, WorkBook } from "xlsx";
import {
  ReadExcelFile,
  ExtractExcelData,
} from "@/_Common/function/SpreedSheet";
import { File as FormidableFile } from "formidable";
import * as XLSX from "xlsx";
import {
  CreateAccessCard,
  CreateAccessCardCascade,
} from "../../accessCard/model/accessCard.model";
import { UpdateStatusRequest } from "@/_Common/interface/general.interface";
import { FileMimeType } from "@/_Common/enum/file-type.enum";
// import logger from "../../../../../libs/winston";
import { ConvertExcel } from "@/_Common/function/SpreedSheet";
import { GetUserFeaturesSingle } from "../../feature/model/feature.model";

const columns = {
  department_desc: "Department Desc",
  cost_center: "Value Stream",
  employee_id: "Employee Id",
  employee_name: "Employee Name",
  employee_category: "Employee  Category",
  eligble_subsidy: "Eligble Subsidy (Yes/No)",
  access_card: "Access Card Number",
  uuid: "UUID",
};

const headers = [
  columns.department_desc,
  columns.cost_center,
  columns.employee_id,
  columns.employee_name,
  columns.employee_category,
  columns.eligble_subsidy,
  columns.access_card,
];

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
        every: {
          active: true, // Ensure every subsidy is active
        },
        some: {
          subsidy_type: {
            subsidy_type_code: SubsidyTypeCode.meal, // Check for meal subsidy type
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
              name: { contains: filter, mode: "insensitive" },
            },
          },
          {
            department: {
              department_name: { contains: filter, mode: "insensitive" },
            },
          },
          {
            cost_center: {
              cost_center_code: { contains: filter, mode: "insensitive" },
            },
          },
          {
            employee_category: {
              employee_category_name: { contains: filter, mode: "insensitive" },
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

    console.log("conditionFilter===>", conditionFilter);

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
            access_card_no: true,
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
        subsidies: {
          select: {
            applicable: true,
            uuid: true,
            start_date: true,
            end_date: true,
            amount: true,
            active: true,
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
        employee_category: {
          select: {
            employee_category_code: true,
            employee_category_name: true,
          },
        },
        access_cards: {
          select: {
            card_value: true,
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
    // logger.error("Failed at UserPaginationService function ===>", { error });

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
//TODO: Will Be Depriacted due to Authentication needed
export async function ScanCheckEmployeeIDService(data: ScanCheckEmployeeID) {
  let message: string = "";
  let status: number = 500;
  try {
    const { employeeID } = data;

    const employee_id = decrypt(employeeID || "");

    await ScanEmployeeIDValidation({ employeeID: employee_id });

    const user = await GetUserSingle({
      where: {
        OR: [
          { employee_id: employee_id },
          {
            access_cards: {
              some: {
                active: true,
                card_value: employee_id,
              },
            },
          },
        ],
        AND: [
          {
            // subsidies: {
            //   some: {
            //     applicable: true,
            //   },
            // },
          },
          {
            subsidies: {
              some: {
                active: true,
                subsidy_type: {
                  subsidy_type_code: SubsidyTypeCode.meal,
                },
              },
            },
          },
        ],
      },
      select: {
        user_id: true,
        employee_id: true,
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

    console.log("employee_id==>", employee_id);

    console.log("User==>", user);

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
      employee_id: user.employee_id,
      employee_name: (user as any)?.UserDetails?.name,
      available_credit: subsidyCredit.credit_amount,
      subsidyCreditUUID: subsidyCredit.uuid,
    });
  } catch (error: any) {
    // logger.error("Failed at ScanCheckEmployeeIDService function ===>", { error });

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

export async function CreateEmployee(data: CreateUpdateUser) {
  let message: string = "";
  let status: number = 500;
  try {
    await CreateUpdateEmployeeValidation(data);

    const {
      name,
      employee_id,
      department_name,
      email,
      password,
      confirmPassword,
      department_code,
      employee_category_code,
      access_card_no,
      cost_center_code,
      subsidy_meal_applicable,
    } = data;

    let hashpassword: string = "";

    if (password) {
      if (!confirmPassword) {
        status = 400;
        throw Error("Confirm Password Need To Create Employee");
      }

      hashpassword = (await hashPassword(password)) || "";

      if (!hashpassword) {
        status = 400;
        throw Error("Password is Empty");
      }
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
        department_code,
      },
    })) as Partial<Department>;

    if (!department) {
      status = 400;
      throw Error("Department not Found");
    }

    const costCenter: Partial<CostCenter> | null = await GetCostCenterSingle({
      where: {
        cost_center_code,
        active: true,
      },
    });

    if (!costCenter) {
      status = 400;
      throw Error("Value Stream not Found");
    }

    const employeeCategory: Partial<EmployeeCategory> =
      (await GetEmployeeCategorySingle({
        where: {
          employee_category_code,
        },
      })) as Partial<EmployeeCategory>;

    if (!employeeCategory) {
      status = 400;
      throw Error("Employee Category not Found");
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

    const user: Partial<User> = {
      email: email ? email : null,
      employee_id,
      password_hash: hashpassword,
      role_id: role.role_id,
      department_id: department.department_id,
      is_email_verified: true,
      is_acc_verify: true,
      active: true,
      employee_category_id: employeeCategory.employee_category_id,
      cost_center_id: costCenter.cost_center_id,
    };

    const userDetails: Partial<UserDetails> = {
      name: name.toLowerCase(),
      access_card_no,
    };

    const createUser = await CreateUserNUserDetailsCascade({
      user: user as User,
      userDetails: userDetails as UserDetails,
    });

    if (!createUser || createUser.length < 0) {
      status = 400;
      throw Error("Failed To Create Employee");
    }

    const user_id: number = createUser[0]?.user_id;

    const SubsidyUser: Partial<Subsidy> = {
      subsidy_type_id: subsidyType.subsidy_type_id,
      user_id,
      applicable: subsidy_meal_applicable === "yes" ? true : false,
    };

    if (access_card_no) {
      const access_card: Partial<AccessCard> = {
        card_value: access_card_no,
        user_id,
      };

      const createAccessCard = await CreateAccessCard({
        data: access_card as AccessCard,
      });

      if (!createAccessCard) {
        status = 400;
        throw Error("Failed To Register Employee Access Card");
      }
    }

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
    // logger.error("Failed at CreateEmployee function ===>", { error });

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

export async function CreateEmployeeBulkUpload(
  data: CreateUserUploadExcel,
  user: User
) {
  interface ExcelCreateEmployee {
    department_desc: string;
    cost_center: string;
    employee_id: string;
    employee_name: string;
    employee_category: string;
    eligble_subsidy: string;
    access_card: string;
    uuid: string;
  }
  let message: string = "";
  let status: number = 500;
  try {
    const { file } = data;

    var workbook = await ReadExcelFile(file);

    if (!workbook) {
      status = 400;
      throw Error("Workbook Cannot Generate");
    }

    const dataExcel = ExtractExcelData(headers, workbook);

    const users: Partial<User>[] = await GetUserMany({
      where: {},
      select: {
        user_id: true,
        employee_id: true,
        uuid: true,
        role_id: true,
        deleted_at: true,
        department_id: true,
        cost_center_id: true,
        employee_category_id: true,
        UserDetails: {
          select: {
            name: true,
            first_name: true,
            last_name: true,
            mobile_phone: true,
            access_card_no: true,
          },
        },
        subsidies: {
          select: {
            subsidy_id: true,
            subsidy_type: true,
            applicable: true,
            active: true,
          },
        },
        access_cards: {
          select: {
            card_id: true,
            card_value: true,
            active: true,
          },
        },
      },
    });

    const departments: Partial<Department>[] = await GetDepartmentLists({
      where: {},
    });

    if (!departments || departments.length < 1) {
      status = 400;
      throw Error("No Departments Found");
    }

    const costCenters: Partial<CostCenter>[] = await GetCostCenterLists({
      where: {},
    });

    if (!costCenters || costCenters.length < 1) {
      status = 400;
      throw Error("No Value Stream Found");
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

    const role: Partial<Role> = (await GetRoleSingle({
      where: {
        role_code: RoleCode.employee,
      },
    })) as Partial<Role>;

    if (!role) {
      status = 400;
      throw Error("Role not Found");
    }

    const employeeCategories: Partial<EmployeeCategory>[] =
      await GetEmployeeCategoryLists({
        where: {},
      });

    if (!employeeCategories || employeeCategories.length < 1) {
      status = 400;
      throw Error("Employee Category Not Found");
    }

    const createUsers: CreateUserUserDetails[] = [];
    const updateUsers: UpdateUserUserDetails[] = [];

    dataExcel.map((items) => {
      items.data.map((data) => {
        const employee: ExcelCreateEmployee = {
          department_desc: String(data[columns.department_desc]).trim(),
          cost_center: String(data[columns.cost_center]).toLowerCase().trim(),
          employee_id: String(data[columns.employee_id]).trim(),
          employee_name: String(data[columns.employee_name])
            .toLowerCase()
            .trim(),
          employee_category: String(data[columns.employee_category])
            .toLowerCase()
            .trim(),
          eligble_subsidy: String(data[columns.eligble_subsidy])
            .toLowerCase()
            .trim(),
          access_card: String(data[columns.access_card]).trim(),
          uuid: String(data[columns.uuid]).trim(),
        };

        const checkDuplicate = createUsers.findIndex(
          (users) => users.user.employee_id === employee.employee_id
        );

        if (checkDuplicate !== -1) {
          status = 400;
          throw new Error(
            `Duplicate Employee ID ${employee.employee_id} in Excel. Please Check at row for Employee ID ${employee.employee_id}`
          );
        }

        // Validate that no values are null or undefined
        const skipKeys = ["access_card", "uuid"]; // Keys to skip validation

        const isValid = Object.entries(employee).every(([key, value]) => {
          if (skipKeys.includes(key)) {
            return true; // Skip validation for keys in the skipKeys array
          }
          return value !== null && value !== undefined && value !== "";
        });

        if (!isValid) {
          status = 400;
          throw new Error(
            `Validation error: Some fields are null, undefined, or empty at Employee ID ${employee.employee_id}`
          );
        }

        // Validate eligibility subsidy
        const validSubsidyValues = ["yes", "no"];
        if (!validSubsidyValues.includes(employee.eligble_subsidy)) {
          throw new Error(
            `Invalid eligble_subsidy value: ${employee.eligble_subsidy}. It must be 'yes' or 'no'.`
          );
        }

        const department: Partial<Department> | undefined = departments.find(
          (item) =>
            item.department_name?.toLocaleLowerCase() ===
            employee.department_desc?.toLocaleLowerCase()
        );

        if (!department) {
          status = 400;
          throw new Error(
            `No name Department ${employee.department_desc} in database. Please Check at row for Employee ID ${employee.employee_id}`
          );
        }

        const costcenter: Partial<CostCenter> | undefined = costCenters.find(
          (items) => items.cost_center_code === employee.cost_center
        );

        if (!costcenter) {
          status = 400;
          throw new Error(
            `No name Value Stream  ${employee.cost_center} in database. Please Check at row for Employee ID ${employee.employee_id}`
          );
        }

        const employeeCategory: Partial<EmployeeCategory> | undefined =
          employeeCategories.find(
            (items) =>
              items.employee_category_code ===
              employee.employee_category.toLocaleLowerCase()
          );

        if (!employeeCategory) {
          status = 400;
          throw new Error(
            `No name Employee Category ${employee.employee_category} in database. Please Check at row for Employee ID ${employee.employee_id}`
          );
        }

        const user: Partial<User> = {
          employee_id: employee.employee_id,
          role_id: role.role_id,
          department_id: department.department_id,
          is_email_verified: true,
          is_acc_verify: true,
          active: true,
          employee_category_id: employeeCategory.employee_category_id,
          cost_center_id: costcenter.cost_center_id,
        };

        const userDetails: Partial<UserDetails> = {
          name: employee.employee_name,
          user_id: 0,
          access_card_no: employee.access_card ? employee.access_card : null,
        };

        const SubsidyUser: Partial<Subsidy> = {
          subsidy_type_id: subsidyType.subsidy_type_id,
          user_id: 0,
          applicable: employee.eligble_subsidy === "yes" ? true : false,
        };

        const accessCard: Partial<AccessCard> = {
          card_value: employee.access_card,
          user_id: 0,
          active: true,
        };

        const createUser: CreateUserUserDetails = {
          user: user as User,
          userDetails: userDetails as UserDetails,
          subsidy: SubsidyUser as Subsidy,
          accessCard: accessCard as AccessCard,
        };

        //Compare by UUID
        const userIndex: number = users.findIndex(
          (user) => user.uuid === employee.uuid
        );
        if (userIndex !== -1 && users[userIndex]?.user_id) {
          if (
            users[userIndex].user_id !== undefined &&
            users[userIndex].user_id !== 0
          ) {
            const UpdateUsersDetails: UpdateUserUserDetails = {
              user: user as User,
              userDetails: userDetails as UserDetails,
              subsidy: SubsidyUser as Subsidy,
            };

            const user_id: number = users[userIndex].user_id as number;
            UpdateUsersDetails.user.user_id = user_id;
            UpdateUsersDetails.userDetails.user_id = user_id;

            const subsidyTypeIndex: number = (
              (users as any)[userIndex]?.subsidies as Subsidy[]
            ).findIndex(
              (subsidy) =>
                (subsidy as any)?.subsidy_type.subsidy_type_id ===
                subsidyType.subsidy_type_id
            );
            if (subsidyTypeIndex !== -1) {
              SubsidyUser.subsidy_id = (users as any)[userIndex]?.subsidies[
                subsidyTypeIndex
              ].subsidy_id as number;
              SubsidyUser.user_id = user_id;
            }
            UpdateUsersDetails.subsidy = SubsidyUser as Subsidy;
            accessCard.user_id = user_id;

            const accessCardUpdate: Partial<AccessCard>[] = [];
            const access_card_validate = ((users as any)[userIndex]?.access_cards as AccessCard[]) ?? [];
            
            const accessCardIndex = access_card_validate.findIndex(
              (accessCard) => accessCard.card_value === employee.access_card
            );
            
            // If access card exists, deactivate all and update
            if (accessCardIndex !== -1) {
              if (access_card_validate.length > 0) {
                access_card_validate.forEach((accessCard) => {
                  accessCard.active = false;
                  accessCard.user_id = user_id;
                  accessCardUpdate.push(accessCard);
                });
              }
            }
            
            // If there is no access card at all, create a new one
            if (access_card_validate.length === 0) {
              if (employee.access_card && employee.access_card.trim() !== "") {
                accessCardUpdate.push({
                  card_value: employee.access_card,
                  active: true,
                  user_id: user_id,
                } as Partial<AccessCard>);
              }
            }

            UpdateUsersDetails.accessCard = accessCardUpdate

            updateUsers.push(UpdateUsersDetails);

          } else {
            createUsers.push(createUser);
          }
        } else {
          createUsers.push(createUser);
        }
      });
    });

    console.log("createUsers==>", createUsers);
    console.log("UpdateUsers==>", updateUsers);

    const createUpdateUserCascade: boolean = await CreateUpdateUserCascade({
      create: createUsers,
      update: updateUsers,
    });

    // console.log("createUpdateUserCascade==>", createUpdateUserCascade);

    if (!createUpdateUserCascade) {
      status = 400;
      throw Error("No User Being Created");
    }

    return NextResponse.json({
      message: "Successfully Create All Employees",
    });
  } catch (error: any) {
    // logger.error("Failed at CreateEmployeeBulkUpload function ===>", { error });

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

// export async function UpdateEmployeeBulkUpload(
//   data: CreateUserUploadExcel,
//   user: User
// ): Promise<any> {
//   interface ExcelCreateEmployee {
//     department_desc: string;
//     cost_center: string;
//     employee_id: string;
//     employee_name: string;
//     employee_category: string;
//     eligble_subsidy: string;
//     mifare_card_no: string;
//   }
//   let message: string = "";
//   let status: number = 500;
//   try {
//     const { file } = data;

//     var workbook = await ReadExcelFile(file);

//     if (!workbook) {
//       status = 400;
//       throw Error("Workbook Cannot Generate");
//     }

//     const dataExcel = ExtractExcelData(headers, workbook);

//     console.log("dataExcel==>", dataExcel[0].data);

//     const employees: Partial<User[]> = (await GetUserMany({
//       where: {},
//       select: {
//         user_id: true,
//         employee_id: true,
//         UserDetails: {
//           select: {
//             UserDetails_id: true,
//           },
//         },
//       },
//     })) as any;

//     if (!employees) {
//       status = 400;
//       throw Error("No Employess Found");
//     }

//     if (dataExcel.length != employees.length) {
//       status = 400;
//       throw Error("There is Mismatch Data To Update Employees");
//     }

//     const departments: Partial<Department>[] = await GetDepartmentLists({
//       where: {},
//     });

//     if (!departments || departments.length < 1) {
//       status = 400;
//       throw Error("No Departments Found");
//     }

//     const costCenters: Partial<CostCenter>[] = await GetCostCenterLists({
//       where: {},
//     });

//     if (!costCenters || costCenters.length < 1) {
//       status = 400;
//       throw Error("No Value Stream Found");
//     }

//     const subsidyType: Partial<SubsidyType> = (await GetSubsidyTypeSingle({
//       where: {
//         subsidy_type_code: SubsidyTypeCode.meal,
//       },
//     })) as Partial<SubsidyType>;

//     if (!subsidyType) {
//       status = 400;
//       throw Error("Subsidy Meal not Found");
//     }

//     const role: Partial<Role> = (await GetRoleSingle({
//       where: {
//         role_code: RoleCode.employee,
//       },
//     })) as Partial<Role>;

//     if (!role) {
//       status = 400;
//       throw Error("Role not Found");
//     }

//     const employeeCategories: Partial<EmployeeCategory>[] =
//       await GetEmployeeCategoryLists({
//         where: {},
//       });

//     if (!employeeCategories || employeeCategories.length < 1) {
//       status = 400;
//       throw Error("Employee Category Not Found");
//     }

//     const updateUsers: UpdateUserUserDetails[] = [];

//     dataExcel.map((items) => {
//       items.data.map((data) => {
//         const employee: ExcelCreateEmployee = {
//           department_desc: String(data[columns.department_desc]).trim(),
//           cost_center: String(data[columns.cost_center]).toLowerCase().trim(),
//           employee_id: String(data[columns.employee_id]).trim(),
//           employee_name: String(data[columns.employee_name])
//             .toLowerCase()
//             .trim(),
//           employee_category: String(data[columns.employee_category])
//             .toLowerCase()
//             .trim(),
//           eligble_subsidy: String(data[columns.eligble_subsidy])
//             .toLowerCase()
//             .trim(),
//           mifare_card_no: String(data[columns.mifare_card_no]).trim(),
//         };

//         const selectedEmployee: Partial<User> = employees.find(
//           (item) => item?.employee_id === employee.employee_id
//         ) as Partial<User>;

//         const checkDuplicate = updateUsers.findIndex(
//           (users) => users.user.employee_id === employee.employee_id
//         );

//         if (checkDuplicate !== -1) {
//           status = 400;
//           throw new Error(
//             `Duplicate Employee ID ${employee.employee_id} in Excel. Please Check at row for Employee ID ${employee.employee_id}`
//           );
//         }

//         const skipKeys = ["mifare_card_no"]; // Keys to skip validation

//         const isValid = Object.entries(employee).every(([key, value]) => {
//           console.log("Key==>", key, "Value==>", value);
//           if (skipKeys.includes(key)) {
//             return true; // Skip validation for keys in the skipKeys array
//           }
//           return value !== null && value !== undefined && value !== "";
//         });

//         if (!isValid) {
//           status = 400;
//           throw new Error(
//             `Validation error: Some fields are null, undefined, or empty at Employee ID ${employee.employee_id}`
//           );
//         }

//         // Validate that no values are null or undefined
//         // const isValid = Object.values(employee).every(
//         //   (value) => value !== null && value !== undefined && value !== ""
//         // );

//         // Validate eligibility subsidy
//         const validSubsidyValues = ["yes", "no"];
//         if (!validSubsidyValues.includes(employee.eligble_subsidy)) {
//           throw new Error(
//             `Invalid eligble_subsidy value: ${employee.eligble_subsidy}. It must be 'yes' or 'no'.`
//           );
//         }

//         const department: Partial<Department> | undefined = departments.find(
//           (item) =>
//             item.department_name?.toLocaleLowerCase() ===
//             employee.department_desc?.toLocaleLowerCase()
//         );

//         if (!department) {
//           status = 400;
//           throw new Error(
//             `No name Department ${employee.department_desc} in database. Please Check at row for Employee ID ${employee.employee_id}`
//           );
//         }

//         const costcenter: Partial<CostCenter> | undefined = costCenters.find(
//           (items) => items.cost_center_code === employee.cost_center
//         );

//         if (!costcenter) {
//           status = 400;
//           throw new Error(
//             `No name Value Stream  ${employee.cost_center} in database. Please Check at row for Employee ID ${employee.employee_id}`
//           );
//         }

//         const employeeCategory: Partial<EmployeeCategory> | undefined =
//           employeeCategories.find(
//             (items) =>
//               items.employee_category_code ===
//               employee.employee_category.toLocaleLowerCase()
//           );

//         if (!employeeCategory) {
//           status = 400;
//           throw new Error(
//             `No name Employee Category ${employee.employee_category} in database. Please Check at row for Employee ID ${employee.employee_id}`
//           );
//         }

//         const user: Partial<User> = {
//           user_id: selectedEmployee.user_id || 0,
//           employee_id: employee.employee_id,
//           role_id: role.role_id,
//           department_id: department.department_id,
//           is_email_verified: true,
//           is_acc_verify: true,
//           active: true,
//           employee_category_id: employeeCategory.employee_category_id,
//           cost_center_id: costcenter.cost_center_id,
//         };

//         const userDetails: Partial<UserDetails> = {
//           UserDetails_id:
//             (selectedEmployee as any)?.UserDetails?.UserDetails_id || 0,
//           name: employee.employee_name,
//           user_id: selectedEmployee.user_id || 0,
//           access_card_no: employee.mifare_card_no,
//         };

//         const SubsidyUser: Partial<Subsidy> = {
//           subsidy_type_id: subsidyType.subsidy_type_id,
//           user_id: 0,
//           applicable: employee.eligble_subsidy === "yes" ? true : false,
//         };

//         const accessCard: Partial<AccessCard> = {
//           card_value: employee.mifare_card_no,
//         };

//         if (!user?.user_id) {
//           status = 400;
//           throw `Employee ID ${user.employee_id} Not Exist`;
//         }
//         const createUser: UpdateUserUserDetails = {
//           user_id: user?.user_id,
//           user: user as User,
//           userDetails: userDetails as UserDetails,
//           subsidy: SubsidyUser as Subsidy,
//           accessCard: accessCard as AccessCard,
//         };

//         updateUsers.push(createUser);
//       });
//     });

//     const createUserCascade = await UpdateUserCascade({
//       details: updateUsers,
//     });

//     if (!createUserCascade || createUserCascade.length !== updateUsers.length) {
//       status = 400;
//       throw Error("No User Being Created");
//     }

//     return NextResponse.json({
//       message: "Successfully Create All Employees",
//     });
//   } catch (error: any) {
//     // logger.error("Failed at CreateEmployeeBulkUpload function ===>", { error });

//     console.error(error);
//     return NextResponse.json(
//       {
//         message: error.message || message,
//       },
//       {
//         status: error.statusCode || status,
//       }
//     );
//   }
// }

//Deploy
export async function UpdateEmployee(data: CreateUpdateUser) {
  let message: string = "";
  let status: number = 500;
  try {
    await CreateUpdateEmployeeValidation(data);

    const {
      name,
      employee_id,
      department_name,
      email,
      password,
      confirmPassword,
      department_code,
      employee_category_code,
      access_card_no,
      cost_center_code,
      subsidy_meal_applicable,
      start_date,
      end_date,
    } = data;

    const getUser: Partial<User> | null = await GetUserSingle({
      where: {
        employee_id,
        subsidies: {
          some: {
            active: true,
          },
        },
        // access_cards: {
        //   some: {
        //     active: true,
        //   },
        // },
      },
      select: {
        user_id: true,
        UserDetails: {
          select: {
            UserDetails_id: true,
          },
        },
        subsidies: {
          select: {
            subsidy_id: true,
            active: true,
          },
        },
        access_cards: {
          select: {
            card_value: true,
            active: true,
          },
        },
        role: {
          select: {
            role_id: true,
          },
        },
        department: {
          select: {
            department_id: true,
          },
        },
        cost_center: {
          select: {
            cost_center_id: true,
          },
        },
        employee_category: {
          select: {
            employee_category_id: true,
          },
        },
      },
    });

    if (!getUser) {
      status = 400;
      throw Error("User not Found");
    }

    console.log("GET USer--->", getUser);

    let hashpassword: string = "";

    if (password) {
      if (!confirmPassword) {
        status = 400;
        throw Error("Confirm Password Need To Create Employee");
      }

      hashpassword = (await hashPassword(password)) || "";

      if (!hashpassword) {
        status = 400;
        throw Error("Password is Empty");
      }
    }

    const role: Partial<Role> = (await GetRoleSingle({
      where: {
        role_code: RoleCode.employee,
        active: true,
      },
    })) as Partial<Role>;

    if (!role) {
      status = 400;
      throw Error("Role not Found");
    }

    const department: Partial<Department> = (await GetDepartmentSingle({
      where: {
        department_code,
        active: true,
      },
    })) as Partial<Department>;

    if (!department) {
      status = 400;
      throw Error("Department not Found");
    }

    const costCenter: Partial<CostCenter> | null = await GetCostCenterSingle({
      where: {
        cost_center_code,
        active: true,
      },
    });

    if (!costCenter) {
      status = 400;
      throw Error("Value Stream not Found");
    }

    const employeeCategory: Partial<EmployeeCategory> =
      (await GetEmployeeCategorySingle({
        where: {
          employee_category_code,
          active: true,
        },
      })) as Partial<EmployeeCategory>;

    if (!employeeCategory) {
      status = 400;
      throw Error("Employee Category not Found");
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

    const user: Partial<User> = {
      user_id: getUser.user_id,
      email: email ? email : null,
      // employee_id,
      password_hash: hashpassword,
      role_id: role.role_id,
      department_id: department.department_id,
      is_email_verified: true,
      is_acc_verify: true,
      active: true,
      employee_category_id: employeeCategory.employee_category_id,
      cost_center_id: costCenter.cost_center_id,
    };

    const userDetails: Partial<UserDetails> = {
      name: name.toLowerCase(),
      user_id: getUser.user_id,
      UserDetails_id: (getUser as any)?.UserDetails?.UserDetails_id,
      access_card_no,
    };

    const getSubsidies: Subsidy[] = (getUser as any)?.subsidies as Subsidy[];

    const subsidies: Subsidy[] = getSubsidies.filter(
      (item) => item.active === true
    );

    console.log("subsidies==>", subsidies);

    if (subsidies.length === 0) {
      status = 400;
      throw new Error("No subsidies found. Please add a subsidy.");
    } else if (subsidies.length > 1) {
      status = 400;
      throw new Error(
        "Wrong Setup For Subsidy. Please Disable Unused Subsidy."
      );
    }

    const createUser = await CreateUserNUserDetailsCascade({
      user: user as User,
      userDetails: userDetails as UserDetails,
    });

    if (!createUser || createUser.length < 0) {
      status = 400;
      throw Error("Failed To Create Employee");
    }

    const user_id: number = createUser[0]?.user_id;

    const SubsidyUser: Partial<Subsidy> = {
      subsidy_id: subsidies[0].subsidy_id,
      subsidy_type_id: subsidyType.subsidy_type_id,
      user_id,
      applicable: subsidy_meal_applicable === "yes" ? true : false,
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
    };

    const updateSubsidyUser: Subsidy = await UpdateSubsidy({
      data: SubsidyUser as Subsidy,
    });

    if (!updateSubsidyUser) {
      status = 400;
      throw Error("Failed to Update Subsidy");
    }

    if (access_card_no) {
      const get_access_cards: Partial<AccessCard>[] = (getUser as any)
        ?.access_cards as Partial<AccessCard>[];

      // if(!access_card){
      //   status = 400;
      // throw Error("Access Card Cannot Have More Than 1 that Active");
      // }

      const access_cards: Partial<AccessCard>[] = get_access_cards.filter(
        (item) => item.active === true
      ) as Partial<AccessCard>[];

      if (access_cards.length > 1) {
        status = 400;
        throw Error("Access Card Cannot Have More Than 1 that Active");
      }

      if (access_cards[0]?.card_value) {
        const access_card: Partial<AccessCard> | undefined =
          get_access_cards.find((item) => item.card_value === access_card_no);

        console.log("access_card==>", access_card);

        if (access_cards[0].card_value !== access_card_no) {
          const access_card: Partial<AccessCard> = {
            card_value: access_card_no,
            user_id,
          };

          const createAccessCard = await CreateAccessCardCascade({
            accessCard: access_card as AccessCard,
          });

          if (!createAccessCard) {
            status = 400;
            throw Error("Failed To Register Employee Access Card");
          }
        } else {
          console.log("No Need To Take Action");
        }
      } else {
        const access_card: Partial<AccessCard> = {
          card_value: access_card_no,
          user_id,
        };

        const createAccessCard = await CreateAccessCardCascade({
          accessCard: access_card as AccessCard,
        });

        if (!createAccessCard) {
          status = 400;
          throw Error("Failed To Register Employee Access Card");
        }
      }
    }

    // console.log("SubsidyUser==>", SubsidyUser);

    // const createSubsidyUser: any = await CreateSubsidy_4User({
    //   data: SubsidyUser as Subsidy,
    // });

    // if (!createSubsidyUser) {
    //   status = 400;
    //   throw Error("Failed To Assign Subsidy Meal");
    // }

    return NextResponse.json({
      message: "Successfully Update Employee",
    });
  } catch (error: any) {
    // logger.error("Failed at UpdateEmployee function ===>", { error });

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

export async function UpdateStatusEmployeeService(data: UpdateStatusRequest) {
  let message: string = "";
  let status: number = 500;
  try {
    await UpdateEmployeeStatusValidation(data);

    const { active_status, uuid } = data;

    const user: Partial<User> | null = await GetUserSingle({
      where: {
        uuid,
      },
    });

    if (!user) {
      status = 400;
      throw Error("Failed To Assign Subsidy Meal");
    }

    const updateUser: Partial<User> = {
      user_id: user.user_id,
      active: active_status,
    };

    const updateUserTransaction = await UpdateUser({
      user: updateUser as User,
    });

    if (!updateUserTransaction) {
      status = 400;
      throw Error("Failed TO Update Status User.");
    }
    return NextResponse.json({
      message: "Successfully Update Employee Status",
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

export async function ScanCheckEmployeeIDAuthService(
  data: ScanCheckEmployeeID,
  user_details: User
) {
  let message: string = "";
  let status: number = 500;
  try {
    const { employeeID } = data;

    const employee_id = decrypt(employeeID || "");

    await ScanEmployeeIDValidation({ employeeID: employee_id });

    console.log("user_details===>", user_details);
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
      throw Error(
        "Transaction only can be done from Cashier In Checking Employee."
      );
    }

    const user = await GetUserSingle({
      where: {
        OR: [
          { employee_id: employee_id },
          {
            UserDetails: {
              some: {
                access_card_no: employee_id,
              },
            },
          },
        ],
        AND: [
          {
            // subsidies: {
            //   some: {
            //     applicable: true,
            //   },
            // },
          },
          {
            subsidies: {
              some: {
                active: true,
                subsidy_type: {
                  subsidy_type_code: SubsidyTypeCode.meal,
                },
              },
            },
          },
        ],
      },
      select: {
        user_id: true,
        employee_id: true,
        UserDetails: {
          select: {
            name: true,
          },
        },
        subsidies: {
          select: {
            subsidy_id: true,
            start_date: true,
            end_date: true,
            applicable: true,
            active: true,
            subsidy_type: {
              select: {
                subsidy_type_code: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      status = 400;
      throw Error("Not Eligable For Subsidy Meal");
    }

    const { subsidies, ...withoutSubsidies } = user as any;

    if ((subsidies as Subsidy[]).length !== 1) {
      status = 400;
      throw Error("User not applicable to any Subsidy ");
    }

    const subsidy: Subsidy | undefined = (subsidies as Subsidy[]).find(
      (item) =>
        (item as any)?.subsidy_type?.subsidy_type_code === SubsidyTypeCode.meal
    );

    if (!subsidy) {
      status = 400;
      throw Error("User not applicable to Meal Subsidy ");
    }

    const currentDate = new Date();

    if (subsidy?.start_date) {
      if (currentDate < subsidy?.start_date) {
        status = 400;
        throw Error(
          "User not applicable to Meal Subsidy Due to Date not Start Yet "
        );
      }

      if (subsidy?.end_date) {
        if (currentDate > subsidy?.start_date) {
          status = 400;
          throw Error(
            "User not applicable to Meal Subsidy Due to Date been set to End"
          );
        }
      }
    }

    console.log("employee_id==>", employee_id);

    console.log("User==>", user);

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

    return {
      status: 200,
      employee_id: user.employee_id,
      employee_name: (user as any)?.UserDetails?.name,
      available_credit: subsidyCredit.credit_amount,
      subsidyCreditUUID: subsidyCredit.uuid,
    };

    // return NextResponse.json({
    //   employee_id: user.employee_id,
    //   employee_name: (user as any)?.UserDetails?.name,
    //   available_credit: subsidyCredit.credit_amount,
    //   subsidyCreditUUID: subsidyCredit.uuid,
    // });
  } catch (error: any) {
    // logger.error("Failed at ScanCheckEmployeeIDService function ===>", { error });

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

export async function ScanCheckEmployeeIDAuthSocketService(
  data: ScanCheckEmployeeID,
  user_details: User
) {
  let message: string = "";
  let status: number = 500;
  try {
    const { employeeID } = data;

    const employee_id = decrypt(employeeID || "");

    await ScanEmployeeIDValidation({ employeeID: employee_id });

    console.log("user_details===>", user_details);
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
      throw Error(
        "Transaction only can be done from Cashier In Checking Employee."
      );
    }

    const user = await GetUserSingle({
      where: {
        OR: [
          { employee_id: employee_id },
          {
            UserDetails: {
              some: {
                access_card_no: employee_id,
              },
            },
          },
        ],
        AND: [
          {
            // subsidies: {
            //   some: {
            //     applicable: true,
            //   },
            // },
          },
          {
            subsidies: {
              some: {
                active: true,
                subsidy_type: {
                  subsidy_type_code: SubsidyTypeCode.meal,
                },
              },
            },
          },
        ],
      },
      select: {
        user_id: true,
        employee_id: true,
        UserDetails: {
          select: {
            name: true,
          },
        },
        subsidies: {
          select: {
            subsidy_id: true,
            start_date: true,
            end_date: true,
            applicable: true,
            active: true,
            subsidy_type: {
              select: {
                subsidy_type_code: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      status = 400;
      throw Error("Not Eligable For Subsidy Meal");
    }

    const { subsidies, ...withoutSubsidies } = user as any;

    if ((subsidies as Subsidy[]).length !== 1) {
      status = 400;
      throw Error("User not applicable to any Subsidy ");
    }

    const subsidy: Subsidy | undefined = (subsidies as Subsidy[]).find(
      (item) =>
        (item as any)?.subsidy_type?.subsidy_type_code === SubsidyTypeCode.meal
    );

    if (!subsidy) {
      status = 400;
      throw Error("User not applicable to Meal Subsidy ");
    }

    const currentDate = new Date();

    if (subsidy?.start_date) {
      if (currentDate < subsidy?.start_date) {
        status = 400;
        throw Error(
          "User not applicable to Meal Subsidy Due to Date not Start Yet "
        );
      }

      if (subsidy?.end_date) {
        if (currentDate > subsidy?.start_date) {
          status = 400;
          throw Error(
            "User not applicable to Meal Subsidy Due to Date been set to End"
          );
        }
      }
    }

    console.log("employee_id==>", employee_id);

    console.log("User==>", user);

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

    return {
      status: 200,
      employee_id: user.employee_id,
      employee_name: (user as any)?.UserDetails?.name,
      available_credit: subsidyCredit.credit_amount,
      subsidyCreditUUID: subsidyCredit.uuid,
    };
  } catch (error: any) {
    // logger.error("Failed at ScanCheckEmployeeIDService function ===>", { error });

    console.error(error);
    return {
      message: error.message || message,

      status: error.statusCode || status,
    };
  }
}

export async function GetDownloadExcelEmployeeDetails() {
  let message: string = "";
  let status: number = 500;
  try {
    const HEADER_ORDER_LIST: string[][] = [headers];

    const users = await GetUserRawQuery();

    console.log("users==>", users);

    const writeExcel = ConvertExcel(HEADER_ORDER_LIST, users);

    return new Response(writeExcel, {
      status: 200,
      headers: {
        "Content-Disposition": 'attachment; filename="employee_details.xlsx"',
        "Content-Type": FileMimeType.XLSX,
      },
    });
  } catch (error: any) {
    console.error(error);
    return {
      message: error.message || message,

      status: error.statusCode || status,
    };
  }
}
