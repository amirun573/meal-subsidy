import { NextResponse } from "next/server";
import * as yup from "yup";
import { hashPassword } from "../model/auth.model";
import { PasswordPassValidation } from "@/_Common/validation/hashing.validation";

export async function HashingPasswordService(data: { password: string }) {
  let message: string = "";
  let status: number = 500;
  try {
    const { password } = data;

    await PasswordPassValidation({ password });

    const hashingPassword_4Save = await hashPassword(password);

    if (!hashingPassword_4Save) {
      status = 400;
      throw Error("Failed To Hashing Password");
    }

    return NextResponse.json({
      statusCode: 200,
      passwordHashing: hashingPassword_4Save,
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
