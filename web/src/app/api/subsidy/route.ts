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
  SubsidyEmployeeUpdate,
  SubsidySubmitPrice,
} from "@/_Common/interface/subsidy.interface";
import {
  CreateSubsidyTransactionService,
  DownloadReportSubsidyTransaction,
  GetSubsidyTransactionPaginationService,
  GetSubsidyTransactionReportChart,
  TriggerCreditService,
  UpdateUserApplicableSubsidy,
} from "./service/subsidy.service";
import { decrypt } from "@/_Common/function/Hashing";
const APIAuth: StatusAPICode[] = [
  StatusAPICode.GET_EMPLOYEE_DETAILS,
  StatusAPICode.SUBSIDY_TRANSACTION_PAGINATION,
  StatusAPICode.SUBSIDY_CHART_REPORT,
  StatusAPICode.SUBSIDY_REPORT_DOWNLOAD,
  StatusAPICode.CREATE_TRIGGER_SUBSIDY_CREDIT,
];

export async function GET(req: any, res: NextApiResponse) {
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
      case StatusAPICode.SUBSIDY_TRANSACTION_PAGINATION: {
        const startDate: string | null = url.searchParams.get("startDate");

        const endDate: string | null = url.searchParams.get("endDate");

        const page: string | null = url.searchParams.get("page");

        const filter: string | null = url.searchParams.get("filter");

        if (!page) {
          statusCode = 400;
          throw Error("Page Not FOund");
        }

        return GetSubsidyTransactionPaginationService({
          page: parseInt(page),
          filter,
          startDate,
          endDate,
        });
      }

      case StatusAPICode.SUBSIDY_CHART_REPORT: {
        const range: string | null = url.searchParams.get("range");

        if (!range) {
          statusCode = 400;
          throw Error("Filter Not FOund");
        }

        return GetSubsidyTransactionReportChart({ range });
      }

      case StatusAPICode.SUBSIDY_REPORT_DOWNLOAD: {
        const startDate: string | null = url.searchParams.get("startDate");
        const endDate: string | null = url.searchParams.get("endDate");
        const employees_id: string | null =
          url.searchParams.get("employees_id");

        if (!startDate || !endDate || !employees_id) {
          statusCode = 400;
          throw Error("Start Date or End Date Not Found");
        }

        return DownloadReportSubsidyTransaction({
          startDate,
          endDate,
          employees_id: JSON.parse(employees_id),
        });
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

        case StatusAPICode.CREATE_SUBSIDY_TRANSACTION: {
          const data: any = body as any;

          if (!data) {
            throw Error("No Data Detected");
          }

          const decryptData: SubsidySubmitPrice = JSON.parse(
            decrypt(data?.encryptedData as string) || "{}"
          );

          if (!decryptData) {
            throw Error("Not Authorized To Proceed");
          }

          return CreateSubsidyTransactionService(decryptData);
        }

        case StatusAPICode.CREATE_TRIGGER_SUBSIDY_CREDIT: {
          const data: any = body as any;

          if (!data) {
            throw Error("No Data Detected");
          }

          const decryptData: string = decrypt(data?.key) || "";

          if (!decryptData) {
            throw Error("Not Authorized To Proceed");
          }

          return TriggerCreditService();
          // return CreateSubsidyTransactionService(decryptData);
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

export async function PUT(req: any, res: any) {
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
        case StatusAPICode.UPDATE_APPLICABLE_SUBSIDY: {
          const data: SubsidyEmployeeUpdate = body as SubsidyEmployeeUpdate;

          if (!data) {
            throw Error("No Data Detected");
          }

          return UpdateUserApplicableSubsidy(data);
          //return WriteAddToCart(data, user);
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
