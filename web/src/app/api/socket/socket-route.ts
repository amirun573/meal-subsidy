import { StatusAPICode } from "@/_Common/enum/status-api-code.enum";
import {
  SignInRequest,
  JWTDecodeInterface,
} from "@/_Common/interface/auth.interface";
import { SignInSocketService } from "../auth/service/auth.service";
import { JWTDecode } from "../auth/model/auth.model";
import { ScanCheckEmployeeIDAuthSocketService } from "../user/service/user.service";
import { SubsidySubmitPrice } from "@/_Common/interface/subsidy.interface";
import { CreateSubsidyTransactionServiceSocketAuth } from "../subsidy/service/subsidy.service";

export default async function SocketRoute(
  statusAPICode: StatusAPICode,
  body: any
) {
  try {
    switch (statusAPICode) {
      case StatusAPICode.sign_in_request: {
        const data: SignInRequest = body as SignInRequest;

        if (!data) {
          throw Error("No Data Detected");
        }

        return SignInSocketService(data);
      }

      case StatusAPICode.GET_CHECK_EMPLOYEE_ID_AUTH: {
        const { employeeID, accessToken } = body;

        if (!employeeID) {
          throw Error("No Employee ID Sent.");
        }

        const auth: JWTDecodeInterface | boolean = (await JWTDecode(
          accessToken
        )) as JWTDecodeInterface | boolean;

        if (!auth) {
          throw Error("No User Found.");
        }

        const { user } = auth as JWTDecodeInterface;

        return ScanCheckEmployeeIDAuthSocketService({ employeeID }, user);
      }

      case StatusAPICode.CREATE_SUBMIT_SUBSIDY_TRANSACTION_AUTH: {
        const data: SubsidySubmitPrice = body as SubsidySubmitPrice;
        const { accessToken } = body;

        const auth: JWTDecodeInterface | boolean = (await JWTDecode(
          accessToken
        )) as JWTDecodeInterface | boolean;

        if (!auth) {
          throw Error("No User Found.");
        }

        const { user } = auth as JWTDecodeInterface;

        return CreateSubsidyTransactionServiceSocketAuth(data, user);
      }

      default: {
        return {
          status: 400,
          message: "Failed to Search API Code",
        };
        break;
      }
    }
  } catch (error) {}
}
