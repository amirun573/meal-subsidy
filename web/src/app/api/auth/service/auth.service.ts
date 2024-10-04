import { NextResponse } from "next/server";
import * as yup from "yup";
import { comparePassword, hashPassword } from "../model/auth.model";
import { PasswordPassValidation } from "@/_Common/validation/hashing.validation";
import {
  SignInRequest,
  UserDetailsLocalStorage,
} from "@/_Common/interface/auth.interface";
import { SignInFunctionValidation } from "@/_Common/validation/auth.validation";
import { GetUserSingle } from "../../user/model/user.model";
import jwt from "jsonwebtoken";
import { encrypt } from "@/_Common/function/Hashing";
import { Feature, UserFeatures } from "@prisma/client";
import { GetUserFeatures } from "../../feature/model/feature.model";
// import logger from "../../../../../libs/winston";


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
    // logger.error("Failed at HashingPasswordService function ===>", { error });

    console.error(error);
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

export async function SignInService(data: SignInRequest) {
  let message: string = "";
  let status: number = 500;
  try {
    const { email, password } = data;

    await SignInFunctionValidation(data);

    const user = await GetUserSingle({
      where: {
        OR: [
          { email: email },               // Email condition
          { employee_id: email }    // Employee ID condition
        ],
      },
      select: {
        user_id: true,
        email: true,
        employee_id: true,
        role_id: true,
        uuid: true,
        password_hash: true,
        is_acc_verify: true,
        UserDetails: {
          select: {
            country: {
              select: {
                country_code: true,
                currency_code: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      status = 400;
      throw Error("No Email Been Found.");
    }

    if (
      !user?.role_id ||
      !user?.uuid ||
      !user?.is_acc_verify ||
      !user?.employee_id
    ) {
      status = 400;
      throw Error("User is missing");
    }


    if(user.password_hash){
      const checkPassword = await comparePassword(password, user.password_hash);
      if (!checkPassword) {
        status = 400;
        throw Error("Wrong Password");
      }
    }

    else{
      status = 400;
      throw Error("You are not Eligble to Login");
    }


    //console.log("checkPassword===>", checkPassword);

    

    const UserFeatures: Partial<UserFeatures>[] = await GetUserFeatures({
      where: {
        user_id: user.user_id,
        active: true,
      },
      select: {
        feature: {
          select: {
            uuid: true,
            feature_code: true,
            feature_name: true,
            description: true,
            feature_link: true,
          },
        },
      },
    });

    const features: Partial<Feature>[] = [];

    if (UserFeatures.length > 0) {
      UserFeatures.map((userFeatures) => {
        const feature: Partial<Feature> = (userFeatures as any)
          ?.feature as Partial<Feature>;

        if (feature) {
          features.push(feature);
        }
      });
    }

    const options = { expiresIn: "10h" }; // Token expiration time

    const accessToken = jwt.sign(
      user,
      process.env.JWT_SECRET_KEY || "",
      options
    );

    const refreshToken = jwt.sign(user, process.env.JWT_SECRET_KEY || "");

    const userDetails: UserDetailsLocalStorage = {
      email: user.email || '',
      employee_id: user.employee_id, // Assuming this is a typo and it should be `username`
      accessToken,
      refreshToken,
      role_id: user.role_id,
      uuid: user.uuid,
      features,
      country_code: (user as any)?.UserDetails?.country?.country_code || "", // Provide default value to avoid `undefined`
      is_acc_verify: user.is_acc_verify,
      currency_code: (user as any)?.UserDetails?.country?.currency_code || "", // Provide default value to avoid `undefined`
    };

    return NextResponse.json({
      userDetails,
    });
  } catch (error: any) {
    // logger.error("Failed at SignInService function ===>", { error });

    console.error(error);
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
