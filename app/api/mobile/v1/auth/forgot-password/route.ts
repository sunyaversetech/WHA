import { NextRequest } from "next/server";
import { sendResetCode } from "@/server/lib/passwordReset";
import { mobileOk, mobileError } from "@/server/lib/mobileResponse";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { email } = body ?? {};
    if (!email) return mobileError("Email is required", 400);

    const result = await sendResetCode(email);
    if (!result.ok) return mobileError(result.message, result.status);

    return mobileOk({ message: result.message });
  } catch (error: any) {
    return mobileError(error.message || "Internal Server Error", 500);
  }
}
