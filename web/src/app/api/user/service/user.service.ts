import { UserPaginationRequest } from "@/_Common/interface/user.interface";
import { NextResponse } from "next/server";

export async function UserPaginationService(data: UserPaginationRequest) {
  let message: string = "";
  let status: number = 500;
  try {
    return NextResponse.json({
      message: "",
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: error.message || message,
      },
      {
        status: error.statusCode || status,
      }
    );
  }
}
