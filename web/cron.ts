import 'module-alias/register';
import cron from "node-cron";
import axios from "axios";
import { StatusAPICode } from "@/_Common/enum/status-api-code.enum";
import { encrypt } from "@/_Common/function/Hashing";

const triggerCredit = async () => {
  try {
    console.log("Herere it's coming");
    const baseURL = process.env.API_BASE_URL || "http://localhost:3000"; // Use environment variable or default

    const response = await axios.post(`${baseURL}/api/subsidy`, {
      [StatusAPICode.code]: StatusAPICode.CREATE_TRIGGER_SUBSIDY_CREDIT_CRON,
      key: encrypt("TRIGGER_CREDIT"),
    });

    console.log("Successfully Trigger Credit");
  } catch (error) {
    console.error("Error in triggerCredit:", error);
  }
};

// cron.schedule('50 7 * * *', triggerCredit, {
//   scheduled: true,
//   timezone: "Asia/Kuala_Lumpur",
// });

cron.schedule("*/15 * * * * *", triggerCredit, {
  scheduled: true,
  timezone: "Asia/Kuala_Lumpur",
});

console.log("Cron job scheduled");
