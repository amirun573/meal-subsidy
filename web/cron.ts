import cron from "node-cron";
import { RunDueCreditScheduleService } from "./src/app/api/subsidy/service/subsidy.service";
import { CREDIT_TIME_ZONE } from "./src/_Common/function/credit-schedule";

// Check each minute so a saved active routine can control the day, time, and
// amount without restarting the server. With no active routine, the service
// retains the original daily 05:50 KL-time trigger.
cron.schedule("* * * * *", async () => {
  try {
    const result = await RunDueCreditScheduleService();
    if (result.status !== "NOT_DUE") {
      console.log("Subsidy credit cron:", result);
    }
  } catch (error) {
    console.error("Subsidy credit cron failed:", error);
  }
}, { scheduled: true, timezone: CREDIT_TIME_ZONE });

console.log(`Subsidy credit cron scheduled (Timezone: ${CREDIT_TIME_ZONE})`);
