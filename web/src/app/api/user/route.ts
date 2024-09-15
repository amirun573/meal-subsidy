import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { prisma } from "../../../../libs/prisma";
import { StatusAPICode } from "../../../_Common/enum/status-api-code.enum";
import { User } from "@prisma/client";
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
  ScanCheckEmployeeIDService,
  UserPaginationService,
} from "./service/user.service";
import {
  CreateUpdateUser,
  CreateUserUploadExcel,
} from "@/_Common/interface/user.interface";

const APIAuth: StatusAPICode[] = [
  StatusAPICode.GET_EMPLOYEE_DETAILS,
  StatusAPICode.CREATE_EMPLOYEE,
  StatusAPICode.UPLOAD_EXCEL_EMPLOYEE_CREATE,
];

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

        return UserPaginationService({
          page: parseInt(page),
          filter,
        });

        // return HashingPasswordService({ password: hashingPasswordRequest });
      }

      case StatusAPICode.GET_CHECK_EMPLOYEE_ID: {
        const employeeID: string | null = url.searchParams.get("employeeID");

        if (!employeeID) {
          statusCode = 400;
          throw Error("No Employee ID Sent.");
        }

        return ScanCheckEmployeeIDService({ employeeID });
      }

      default: {
        statusCode = 400;
        throw Error("Code not Found");
      }
    }
  } catch (error: any) {
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

          return CreateEmployee(data);
        }

        case StatusAPICode.UPLOAD_EXCEL_EMPLOYEE_CREATE: {
          const data: CreateUserUploadExcel = body as CreateUserUploadExcel;

          if (!user) {
            throw Error("No User Found");
          }

          return CreateEmployeeBulkUpload(data, user);
        }

        default: {
          throw Error("No Code Found");
        }
      }
    }
  } catch (error: any) {
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
