import type { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";
import { prisma } from "../../../../../libs/prisma";
import { StatusAPICode } from "../../../../_Common/enum/status-api-code.enum";
import { User } from "@prisma/client";
import { JWTDecodeInterface, SignInRequest } from "@/_Common/interface/auth.interface";
import { JWTDecode, hashPassword } from "../model/auth.model";
import { HashingPasswordService, SignInService } from "../service/auth.service";
import { GetBodyData } from "@/_Common/function/Authentication";
import { FeaturesCodeLists } from "@/_Common/enum/features.enum";
// import logger from "../../../../../libs/winston";


const APIAuth: StatusAPICode[] = [];
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
        statusCode = 400;
        throw Error("No Token Found");
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
      case StatusAPICode.hashing_password: {
        const hashingPasswordRequest: string | null = url.searchParams.get(
          "hashingPasswordRequest"
        );

        if (!hashingPasswordRequest) {
          statusCode = 400;
          throw Error("No Password Sent");
        }

        return HashingPasswordService({ password: hashingPasswordRequest });
      }

      default: {
        statusCode = 400;
        throw Error("Code not Found");
      }
    }
  } catch (error: any) {
    // logger.error("Failed at Route GET Auth ===>", { error });

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

          return SignInService(data)
          //return WriteAddToCart(data, user);
        }

        default: {
          throw Error("No Code Found");
        }
      }
    }
  } catch (error: any) {
    // logger.error("Failed at Route POST Auth ===>", { error });

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
