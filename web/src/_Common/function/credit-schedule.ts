import { RoutineFrequency } from "@prisma/client";

export const CREDIT_TIME_ZONE = "Asia/Kuala_Lumpur";
export const LEGACY_TRIGGER_TIME = "05:50";

export type ActiveRoutine = {
  subsidy_schedule_id: number;
  routine_frequency: RoutineFrequency | null;
  trigger_time: string | null;
  day_of_week: number | null;
  day_of_month: number | null;
  amount: number;
};

export type DueCreditRun = {
  runKey: string;
  scheduleId: number | null;
  amount: number | undefined;
};

const clockFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: CREDIT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function getKualaLumpurClock(now: Date) {
  const values = Object.fromEntries(
    clockFormatter.formatToParts(now).map(({ type, value }) => [type, value])
  );
  const year = Number(values.year);
  const month = Number(values.month);
  const day = Number(values.day);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
    dayOfWeek: weekday === 0 ? 7 : weekday, // Monday = 1, Sunday = 7
    dayOfMonth: day,
  };
}

export function getDueCreditRun(
  routine: ActiveRoutine | null,
  now: Date
): DueCreditRun | null {
  const clock = getKualaLumpurClock(now);

  if (!routine) {
    return clock.time === LEGACY_TRIGGER_TIME
      ? {
          runKey: `cron:${clock.date}`,
          scheduleId: null,
          amount: undefined, // Preserve the subsidy-type price used by the old job.
        }
      : null;
  }

  assertValidRoutine(routine);
  const time = routine.trigger_time!;
  if (clock.time !== time) return null;

  if (routine.routine_frequency === "WEEKLY" && clock.dayOfWeek !== routine.day_of_week) return null;
  if (routine.routine_frequency === "MONTHLY" && clock.dayOfMonth !== routine.day_of_month) return null;

  return {
    runKey: `cron:${clock.date}`,
    scheduleId: routine.subsidy_schedule_id,
    amount: routine.amount,
  };
}

export function assertValidRoutine(routine: ActiveRoutine): void {
  const time = routine.trigger_time;
  if (!time || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    throw new Error(`Active routine ${routine.subsidy_schedule_id} has an invalid trigger time`);
  }
  if (!Number.isFinite(routine.amount) || routine.amount <= 0) {
    throw new Error(`Active routine ${routine.subsidy_schedule_id} must have a positive amount`);
  }

  switch (routine.routine_frequency) {
    case "DAILY":
      break;
    case "WEEKLY":
      if (!Number.isInteger(routine.day_of_week) || routine.day_of_week! < 1 || routine.day_of_week! > 7) {
        throw new Error(`Active routine ${routine.subsidy_schedule_id} has an invalid weekday`);
      }
      break;
    case "MONTHLY":
      if (!Number.isInteger(routine.day_of_month) || routine.day_of_month! < 1 || routine.day_of_month! > 31) {
        throw new Error(`Active routine ${routine.subsidy_schedule_id} has an invalid month day`);
      }
      break;
    default:
      throw new Error(`Active routine ${routine.subsidy_schedule_id} has no valid frequency`);
  }
}
