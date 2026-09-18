import { NextResponse } from "next/server";

// The custom server imports web/cron.ts. This endpoint must not register an
// additional in-process job every time it is requested.
export async function GET() {
  return NextResponse.json({
    message: "Subsidy scheduling is managed by the custom server cron worker",
  });
}
