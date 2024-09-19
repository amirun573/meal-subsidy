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
import { SubsidyEmployeeUpdate } from "@/_Common/interface/subsidy.interface";
import {
  CostCenterLists,
  DepartmentLists,
  EmployeeCategoryListsService,
} from "./service/department.service";
const APIAuth: StatusAPICode[] = [
  StatusAPICode.GET_DEPARTMENT_LISTS,
  StatusAPICode.GET_EMPLOYEE_CATEGORY_LISTS,
  StatusAPICode.GET_COST_CENTER_LISTS,
];
import logger from "../../../../libs/winston";
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
      case StatusAPICode.GET_DEPARTMENT_LISTS: {
        return DepartmentLists();
      }

      case StatusAPICode.GET_EMPLOYEE_CATEGORY_LISTS: {
        return EmployeeCategoryListsService();
      }
      case StatusAPICode.GET_COST_CENTER_LISTS: {
        return CostCenterLists();
      }
      default: {
        statusCode = 400;
        throw Error("Code not Found");
      }
    }
  } catch (error: any) {
    logger.error("Failed at Route GET Department ===>", { error });

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
        default: {
          throw Error("No Code Found");
        }
      }
    }
  } catch (error: any) {
    logger.error("Failed at Route POST Department ===>", { error });

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
        default: {
          throw Error("No Code Found");
        }
      }
    }
  } catch (error: any) {
    logger.error("Failed at Route PUT Department ===>", { error });

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
