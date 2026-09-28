import { NextRequest } from "next/server";
import { verifyResetCode, setNewPassword } from "@/server/lib/passwordReset";
import { mobileOk, mobileError } from "@/server/lib/mobileResponse";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { email, code, password } = body ?? {};
    if (!email || !code || !password) {
      return mobileError("Email, code and password are required", 400);
    }

    // Check the code first so a wrong/expired code gets its own clear message,
    // rather than setNewPassword's generic "Unauthorized request".
    const verify = await verifyResetCode(email, code);
    if (!verify.ok) return mobileError(verify.message, verify.status);

    const result = await setNewPassword(email, code, password);
    if (!result.ok) return mobileError(result.message, result.status);

    return mobileOk({ message: result.message });
  } catch (error: any) {
    return mobileError(error.message || "Internal Server Error", 500);
  }
}
