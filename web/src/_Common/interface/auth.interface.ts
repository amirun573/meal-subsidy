import { RoleList } from "../enum/role.enum";
import { User } from "@prisma/client";

export interface UserDetailsLocalStorage {
  email: string;
  username: string;
  accessToken: string;
  role_id: RoleList;
  uuid: string;
  country_code: string;
  is_acc_verify: boolean;
  profile_image: string;
  currency_code: string;
}

export interface JWTDecodeInterface {
  email: string;
  iat: number;
  exp: number;
  user: User;
}
