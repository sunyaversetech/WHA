"use server";
import { cookies } from "next/headers";

/**
 * CHECK SESSION
 * */

export async function checkSession() {
  const cookie = await cookies();
  const accessToken: any = cookie?.get("user_token")?.value;
  if (accessToken) return true;
  return false;
}

/**
 * GENERATE HEADERS TO SEND TO REQUEST
 * */

export async function getHeaders() {
  const cookie = await cookies();
  const accessToken: any = cookie?.get("user_token")?.value;
  let headers: {
    "Content-Type": string;
    Accept: string;
    Authorization?: string;
  } = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  // if session exists, add the access token to the headers
  if (await checkSession()) {
    headers = {
      ...headers,
      Authorization: `Bearer ${accessToken}`,
    };
  }
  return headers;
}
