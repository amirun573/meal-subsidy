import { StatusAPICode } from "@/_Common/enum/status-api-code.enum";
import { SignInRequest } from "@/_Common/interface/auth.interface";
import { SignInSocketService } from "../auth/service/auth.service";

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

        return SignInSocketService(data)
      }

      default: {

        return {
            status: 400,
            message: "Failed to Search API Code"
        }
        break;
      }
      
    }
  } catch (error) {}
}
