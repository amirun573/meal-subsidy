"use client";

import { UserDetailsLocalStorage } from "../interface/auth.interface";

export async function SetUserDetailsLocalStoage(data: UserDetailsLocalStorage) {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("userDetails", JSON.stringify(data));
      return true;
    } catch (error) {
      console.error("Error saving to localStorage:", error);
      return false;
    }
  }
}

export async function HandleUnAuthorized(error: any): Promise<boolean> {
  try {
    console.log("Error==>", error);
    if (error?.response?.status === 401 || !error) {
      // Sign out the user
      localStorage.removeItem("userDetails");
      window.location.href = "/";
      // Remove the key from local storage
      return true;
    }

    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
}
