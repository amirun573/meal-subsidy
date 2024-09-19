import { getSession } from "next-auth/react";
import jwt from "jsonwebtoken";
import { JWTDecodeInterface } from "@/_Common/interface/auth.interface";
import { User } from "@prisma/client";
import { compare, hash } from "bcrypt";
import { GetUserSingle } from "../../user/model/user.model";
import logger from "../../../../../libs/winston";
// import { getUserByEmail } from "../users/model/users.model";
export async function JWTDecode(
  req: any
): Promise<JWTDecodeInterface | boolean> {
  try {
    // Decode the JWT token
    //const decodedToken: JwtPayload = jwtDecode(accessToken);

    // Log the decoded token
    //console.log(decodedToken);
    const token = req?.headers?.get("authorization") || req;

    console.log("TOKEN===>", token);

    if (token) {
      try {
        const accessToken = token.replace("Bearer ", "");

        if (accessToken) {
          const decodedToken: any = jwt.verify(
            accessToken,
            process.env.JWT_SECRET_KEY || "",
            { ignoreExpiration: false }
          );

          // Perform additional validation if needed
          if (decodedToken && decodedToken?.exp) {
            // Token is valid

            const user = await GetUserSingle({
              where: {
                email: decodedToken.email,
              },
              select: {
                user_id: true,
                email: true,
                active: true,
                uuid: true,
                UserDetails: {
                  select: {
                    name: true,
                    mobile_phone: true,
                    country: {
                      select: {
                        country_id: true,
                        country_name: true,
                        currency_code: true,
                      },
                    },
                  },
                },
                role: {
                  select: {
                    role_id: true,
                    role_code: true,
                    active: true,
                  },
                },
              },
            });

            if (!user || !user.active) {
              return false;
            }

            decodedToken.user = user;
            return decodedToken as JWTDecodeInterface;
          } else {
            // Token is invalid

            return false;
          }
        } else return false;
      } catch (error) {
        // Token verification failed
        console.error("Token verification failed==>", error);

        return false;
      }
    } else {
      // No session or token found
      console.error("No session or token found");

      return false;
    }

    const session: any = await getSession({ req });

    console.log("Session==>", session);
    // if (session && session.accessToken) {
    //   try {
    //     const decodedToken = jwt.verify(
    //       session.accessToken,
    //       process.env.JWT_SECRET
    //     );

    //     // Perform additional validation if needed
    //     if (decodedToken && decodedToken.exp) {
    //       // Token is valid
    //       return decodedToken;
    //     } else {
    //       // Token is invalid
    //       console.log("Error==> Invalid");

    //       return false;
    //     }
    //   } catch (error) {
    //     // Token verification failed
    //     console.log("Error==>", error);

    //     return false;
    //   }
    // } else {
    //   // No session or token found
    //   console.log("Error==>  No session or token found");

    //   return false;
    // }
  } catch (error) {
    logger.error("Failed at JWTDecode function ===>", { error });

    console.log("Error==>", error);
    return false;
  }
}

export async function hashPassword(password: string): Promise<string | null> {
  try {
    const saltRounds = 10; // Number of salt rounds
    const hashedPassword = await hash(password, saltRounds);
    return hashedPassword;
  } catch (error) {
    logger.error("Failed at hashPassword function ===>", { error });

    console.error(error);
    return null;
  }
}

export async function comparePassword(
  password: string,
  hashedPassword: string
) {
  try {
    const match = await compare(password, hashedPassword);
    return match;
  } catch (error) {
    console.error(error);
    return false;
  }
}
