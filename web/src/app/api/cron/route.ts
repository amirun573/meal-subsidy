import { StatusAPICode } from "@/_Common/enum/status-api-code.enum";
import { encrypt } from "@/_Common/function/Hashing";
import axios from "axios";
import { NextResponse } from "next/server";

var cron = require("node-cron");

export async function GET(req: any, res: any) {
  try {
    interface ApiResponse {
      key: string;
      value: string;
    }

    const triggerCredit = async () => {
      try {
        const requestTriggerCredit = await axios.post(
          "/api/subsidy",
          {
            [StatusAPICode.code]:
              StatusAPICode.CREATE_TRIGGER_SUBSIDY_CREDIT_CRON,
            key: encrypt(`TRIGGER_CREDIT`),
          },
          {}
        );
      } catch (error) {}
    };

    // Schedule the task to run every minute
    cron.schedule("50 7 * * *", triggerCredit, {
      scheduled: true,
      timezone: "Asia/Kuala_Lumpur", // Specify the timezone
    });
    console.log("Cron job scheduled");

    return NextResponse.json({ data: "Success", status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: error }, { status: 500 });
  }
}
