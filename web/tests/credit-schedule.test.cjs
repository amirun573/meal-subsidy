const assert = require("node:assert/strict");
const test = require("node:test");
const { getDueCreditRun, getKualaLumpurClock } = require("../src/_Common/function/credit-schedule.ts");

const saturdayAtEightKL = new Date("2026-09-19T00:00:00.000Z");
const routine = {
  subsidy_schedule_id: 7,
  routine_frequency: "DAILY",
  trigger_time: "08:00",
  day_of_week: null,
  day_of_month: null,
  amount: 10,
};

test("converts UTC to Kuala Lumpur calendar time", () => {
  assert.deepEqual(getKualaLumpurClock(saturdayAtEightKL), {
    date: "2026-09-19",
    time: "08:00",
    dayOfWeek: 6,
    dayOfMonth: 19,
  });
});

test("keeps the 05:50 legacy run only when there is no active routine", () => {
  const legacyTime = new Date("2026-09-18T21:50:00.000Z");
  assert.deepEqual(getDueCreditRun(null, legacyTime), {
    runKey: "cron:2026-09-19",
    scheduleId: null,
    amount: undefined,
  });
  assert.equal(getDueCreditRun(routine, legacyTime), null);
  assert.equal(getDueCreditRun(null, saturdayAtEightKL), null);
});

test("runs a daily routine at its configured time and amount", () => {
  assert.deepEqual(getDueCreditRun(routine, saturdayAtEightKL), {
    runKey: "cron:2026-09-19",
    scheduleId: 7,
    amount: 10,
  });
  assert.equal(getDueCreditRun(routine, new Date("2026-09-19T00:01:00.000Z")), null);
});

test("honors Monday=1 through Sunday=7 for weekly routines", () => {
  const weekly = { ...routine, routine_frequency: "WEEKLY", day_of_week: 6 };
  assert.ok(getDueCreditRun(weekly, saturdayAtEightKL));
  assert.equal(getDueCreditRun({ ...weekly, day_of_week: 1 }, saturdayAtEightKL), null);
});

test("honors the configured day of month", () => {
  const monthly = { ...routine, routine_frequency: "MONTHLY", day_of_month: 19 };
  assert.ok(getDueCreditRun(monthly, saturdayAtEightKL));
  assert.equal(getDueCreditRun({ ...monthly, day_of_month: 20 }, saturdayAtEightKL), null);
  assert.equal(getDueCreditRun({ ...monthly, day_of_month: 31 }, new Date("2026-09-30T00:00:00.000Z")), null);
});

test("never falls back when an active routine is invalid", () => {
  assert.throws(() => getDueCreditRun({ ...routine, amount: 0 }, saturdayAtEightKL), /positive amount/);
  assert.throws(() => getDueCreditRun({ ...routine, trigger_time: "25:00" }, saturdayAtEightKL), /trigger time/);
  assert.throws(() => getDueCreditRun({ ...routine, routine_frequency: "WEEKLY", day_of_week: 8 }, saturdayAtEightKL), /weekday/);
});
