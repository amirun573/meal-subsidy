import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { prisma } from "../../../../libs/prisma";
import { StatusAPICode } from "../../../_Common/enum/status-api-code.enum";
import { User, UserFeatures } from "@prisma/client";
import {
  JWTDecodeInterface,
  SignInRequest,
} from "@/_Common/interface/auth.interface";
import { GetBodyData } from "@/_Common/function/Authentication";
import { JWTDecode } from "../auth/model/auth.model";
import { SignInService } from "../auth/service/auth.service";
import {
  CreateEmployee,
  CreateEmployeeBulkUpload,
  ScanCheckEmployeeIDAuthService,
  ScanCheckEmployeeIDService,
  UpdateEmployee,
  UpdateEmployeeBulkUpload,
  UpdateStatusEmployeeService,
  UserPaginationService,
  GetDownloadExcelEmployeeDetails,
} from "./service/user.service";
import {
  CreateUpdateUser,
  CreateUserUploadExcel,
} from "@/_Common/interface/user.interface";
import { UpdateStatusRequest } from "@/_Common/interface/general.interface";
import { CheckFeatureAllowed } from "@/_Common/function/Feature";
import {
  ActionEnableFeature,
  FeaturesCodeLists,
} from "@/_Common/enum/features.enum";
// import logger from "../../../../libs/winston";

const APIAuth: StatusAPICode[] = [
  StatusAPICode.GET_EMPLOYEE_DETAILS,
  StatusAPICode.CREATE_EMPLOYEE,
  StatusAPICode.UPLOAD_EXCEL_EMPLOYEE_CREATE,
  StatusAPICode.UPDATE_USER_ACTIVE_STATUS,
  StatusAPICode.GET_CHECK_EMPLOYEE_ID_AUTH,
  StatusAPICode.UPDATE_EMPLOYEE,
  StatusAPICode.UPDATE_USER_ACTIVE_STATUS,
  StatusAPICode.GET_DOWNLOAD_EXCEL_EMPLOYEE,
];

const feature_code_employee_details: FeaturesCodeLists =
  FeaturesCodeLists.employee_details;

export async function GET(req: any, res: any) {
  let statusCode: number = 500;

  try {
    const url = new URL(req.url);
    const code: string | null = url.searchParams.get("code");

    if (!code) {
      throw Error("No Code");
    }

    let user: User | null = null;
    let tokenDetails;

    if (APIAuth.find((item) => item === parseInt(code))) {
      const token: JWTDecodeInterface | boolean = await JWTDecode(req);

      if (!token) {
        statusCode = 401;
        throw Error("Unauthorized. Please Login");
      }
      tokenDetails = token as JWTDecodeInterface;

      if (!tokenDetails) {
        statusCode = 400;
        throw Error("No Token Details");
      }

      user = tokenDetails.user;
    } else {
      const userAgent = req.headers["user-agent"] || "";

      if (/curl|wget|Postman|HttpClient/i.test(userAgent)) {
        throw Error("Not Found");
      }
    }

    switch (parseInt(code) as StatusAPICode) {
      case StatusAPICode.GET_EMPLOYEE_DETAILS: {
        const page: string | null = url.searchParams.get("page");

        const filter: string | null = url.searchParams.get("filter");

        if (!page) {
          statusCode = 400;
          throw Error("No Page Sent.");
        }

        if (!user) {
          statusCode = 401;
          throw Error(`Unaunthorized Detected.`);
        }

        const user_features: UserFeatures[] = (user as any)
          ?.user_features as UserFeatures[];

        const checkFeature: boolean = await CheckFeatureAllowed({
          user_features,
          action: ActionEnableFeature.READ,
          feature_code: feature_code_employee_details,
        });

        if (!checkFeature) {
          statusCode = 401;
          throw Error(`Unaunthorized Action For ${user.employee_id}`);
        }

        return UserPaginationService({
          page: parseInt(page),
          filter,
        });

        // return HashingPasswordService({ password: hashingPasswordRequest });
      }
      //TODO: For Scanning at Page Scan. Will Deprecite Later
      case StatusAPICode.GET_CHECK_EMPLOYEE_ID: {
        const employeeID: string | null = url.searchParams.get("employeeID");

        if (!employeeID) {
          statusCode = 400;
          throw Error("No Employee ID Sent.");
        }

        return ScanCheckEmployeeIDService({ employeeID });
      }
      //For Scanning at Page Scan.

      case StatusAPICode.GET_CHECK_EMPLOYEE_ID_AUTH: {
        const employeeID: string | null = url.searchParams.get("employeeID");

        if (!employeeID) {
          statusCode = 400;
          throw Error("No Employee ID Sent.");
        }

        if (!user) {
          statusCode = 400;
          throw Error("No User Found.");
        }

        return ScanCheckEmployeeIDAuthService({ employeeID }, user);
      }

      case StatusAPICode.GET_DOWNLOAD_EXCEL_EMPLOYEE: {
        if (!user) {
          statusCode = 400;
          throw Error("No User Found.");
        }

        return GetDownloadExcelEmployeeDetails();
      }

      default: {
        statusCode = 400;
        throw Error("Code not Found");
      }
    }
  } catch (error: any) {
    // logger.error("Failed at Route GET User ===>", { error });

    console.error(error);
    return NextResponse.json(
      {
        message: error.message,
      },
      {
        status: statusCode,
      }
    );
  }
}

export async function POST(req: any, res: any) {
  let statusCode: number = 500;
  try {
    let body: any = await GetBodyData(req);

    if (!body) {
      throw Error("Body Not Found");
    }

    const { code } = body;

    if (!code || typeof parseInt(code) !== "number") {
      throw Error("Code Not Found");
    }

    const token: JWTDecodeInterface | boolean = await JWTDecode(req);
    let user: User | null = null;

    if (APIAuth.find((item) => item === parseInt(code))) {
      if (!token) {
        throw Error("No Token Found");
      }
      user = (token as JWTDecodeInterface).user;
    }

    if (code && typeof parseInt(code) === "number") {
      switch (parseInt(code) as StatusAPICode) {
        case StatusAPICode.sign_in_request: {
          const data: SignInRequest = body as SignInRequest;

          if (!data) {
            throw Error("No Data Detected");
          }

          return SignInService(data);
          //return WriteAddToCart(data, user);
        }

        case StatusAPICode.CREATE_EMPLOYEE: {
          const data: CreateUpdateUser = body as CreateUpdateUser;

          if (!data) {
            throw Error("No Data Detected");
          }

          if (!user) {
            statusCode = 401;
            throw Error(`Unaunthorized Detected.`);
          }

          const user_features: UserFeatures[] = (user as any)
            ?.user_features as UserFeatures[];

          const checkFeature: boolean = await CheckFeatureAllowed({
            user_features,
            action: ActionEnableFeature.WRITE,
            feature_code: feature_code_employee_details,
          });

          if (!checkFeature) {
            statusCode = 400;
            throw Error(`Unaunthorized Action For ${user.employee_id}`);
          }

          return CreateEmployee(data);
        }

        case StatusAPICode.UPLOAD_EXCEL_EMPLOYEE_CREATE: {
          const data: CreateUserUploadExcel = body as CreateUserUploadExcel;

          if (!user) {
            statusCode = 401;
            throw Error(`Unaunthorized Detected.`);
          }

          const user_features: UserFeatures[] = (user as any)
            ?.user_features as UserFeatures[];

          const checkFeature: boolean = await CheckFeatureAllowed({
            user_features,
            action: ActionEnableFeature.WRITE,
            feature_code: feature_code_employee_details,
          });

          if (!checkFeature) {
            statusCode = 400;
            throw Error(`Unaunthorized Action For ${user.employee_id}`);
          }

          return CreateEmployeeBulkUpload(data, user);
        }

        case StatusAPICode.UPLOAD_UPDATE_EXCEL_EMPLOYEE_CREATE: {
          const data: CreateUserUploadExcel = body as CreateUserUploadExcel;

          if (!user) {
            statusCode = 401;
            throw Error(`Unaunthorized Detected.`);
          }

          const user_features: UserFeatures[] = (user as any)
            ?.user_features as UserFeatures[];

          const checkFeature: boolean = await CheckFeatureAllowed({
            user_features,
            action: ActionEnableFeature.WRITE,
            feature_code: feature_code_employee_details,
          });

          if (!checkFeature) {
            statusCode = 400;
            throw Error(`Unaunthorized Action For ${user.employee_id}`);
          }

          return UpdateEmployeeBulkUpload(data, user);
        }

        default: {
          throw Error("No Code Found");
        }
      }
    }
  } catch (error: any) {
    // logger.error("Failed at Route POST User ===>", { error });

    console.error(error);
    return NextResponse.json(
      {
        message: error?.message,
      },
      {
        status: error?.statusCode || statusCode,
      }
    );
  }
}

export async function PUT(req: any, res: any) {
  let statusCode: number = 500;
  try {
    let body: any = await GetBodyData(req);

    if (!body) {
      throw Error("Body Not Found");
    }

    const { code } = body;

    if (!code || typeof parseInt(code) !== "number") {
      throw Error("Code Not Found");
    }

    const token: JWTDecodeInterface | boolean = await JWTDecode(req);
    let user: User | null = null;

    if (APIAuth.find((item) => item === parseInt(code))) {
      if (!token) {
        throw Error("No Token Found");
      }
      user = (token as JWTDecodeInterface).user;
    }

    if (code && typeof parseInt(code) === "number") {
      switch (parseInt(code) as StatusAPICode) {
        case StatusAPICode.UPDATE_EMPLOYEE: {
          const data: CreateUpdateUser = body as CreateUpdateUser;

          if (!data) {
            throw Error("No Data Detected");
          }

          if (!user) {
            statusCode = 401;
            throw Error(`Unaunthorized Detected.`);
          }

          const user_features: UserFeatures[] = (user as any)
            ?.user_features as UserFeatures[];

          const checkFeature: boolean = await CheckFeatureAllowed({
            user_features,
            action: ActionEnableFeature.WRITE,
            feature_code: feature_code_employee_details,
          });

          if (!checkFeature) {
            statusCode = 400;
            throw Error(`Unaunthorized Action For ${user.employee_id}`);
          }

          return UpdateEmployee(data);
        }

        case StatusAPICode.UPDATE_USER_ACTIVE_STATUS: {
          const data: UpdateStatusRequest = body as UpdateStatusRequest;

          if (!data) {
            throw Error("No Data Detected");
          }

          if (!user) {
            statusCode = 401;
            throw Error(`Unaunthorized Detected.`);
          }

          const user_features: UserFeatures[] = (user as any)
            ?.user_features as UserFeatures[];

          const checkFeature: boolean = await CheckFeatureAllowed({
            user_features,
            action: ActionEnableFeature.WRITE,
            feature_code: feature_code_employee_details,
          });

          if (!checkFeature) {
            statusCode = 400;
            throw Error(`Unaunthorized Action For ${user.employee_id}`);
          }

          return UpdateStatusEmployeeService(data);
        }

        default: {
          throw Error("No Code Found");
        }
      }
    }
  } catch (error: any) {
    // logger.error("Failed at Route PUT User ===>", { error });

    console.error(error);
    return NextResponse.json(
      {
        message: error.message,
      },
      {
        status: error.statusCode,
      }
    );
  }
}
