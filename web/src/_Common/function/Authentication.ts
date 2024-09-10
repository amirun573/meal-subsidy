import { UserDetailsLocalStorage } from "../interface/auth.interface";
import { Content_Type } from '../enum/content-type.enum';

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


export async function GetBodyData(req: any) {
  let body: any = null;

  const contentType: string = req.headers.get("Content-Type");

  if (contentType.includes(Content_Type.JSON)) {
    body = await req.json();
  } else if (contentType.includes(Content_Type.FORM_DATA)) {
    const formData = await req.formData();
    body = {};
    for (const [key, value] of formData.entries()) {
      body[key] = value;
    }
  }

  if (!body) {
    return null;
  }

  return body;
}



