import { NextResponse } from "next/server";
import { prisma } from "../../../../libs/prisma";
import { JWTDecode } from "../auth/model/auth.model";
import { JWTDecodeInterface } from "@/_Common/interface/auth.interface";
import { RoleList } from "@/_Common/enum/role.enum";
import { LogApplicationError } from "@/_Common/server/application-log";

export async function GET(req: Request) {
  const token = await JWTDecode(req);
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  const user = (token as JWTDecodeInterface).user;
  const roleId = (user as any)?.role?.role_id;
  if (roleId !== RoleList.ADMIN && roleId !== RoleList.SUPER_ADMIN) {
    return NextResponse.json({ message: "Not allowed to view application logs" }, { status: 403 });
  }
  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page"));
  if (!Number.isSafeInteger(page) || page < 1) {
    return NextResponse.json({ message: "Page must be a positive integer" }, { status: 400 });
  }
  const limit = 25;
  try {
    const [logs, totalItems] = await Promise.all([
      prisma.applicationLog.findMany({
        orderBy: [{ created_at: "desc" }, { id: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.applicationLog.count(),
    ]);
    return NextResponse.json({ logs, totalItems, page });
  } catch (error) {
    await LogApplicationError("api/logs GET", error);
    return NextResponse.json({ message: "Unable to load application logs" }, { status: 500 });
  }
}
