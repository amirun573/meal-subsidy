import { UserDetailsLocalStorage } from "../interface/auth.interface";

export async function GetLocalStorageDetails(): Promise<
  UserDetailsLocalStorage | boolean
> {
  try {
    const details = localStorage.getItem("userDetails");

    if (!details) {
      throw new Error("User details not found in local storage");
    }

    const userDetailsLocalStorage = JSON.parse(
      details
    ) as UserDetailsLocalStorage;
    return userDetailsLocalStorage;
  } catch (error: any) {
    console.log(error);
    return false;
  }
}
