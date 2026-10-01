import { NextRequest } from "next/server";
import { verifyResetCode } from "@/server/lib/passwordReset";
import { mobileOk, mobileError } from "@/server/lib/mobileResponse";

// Mirrors the existing web /api/auth/verify-code exactly (same shared
// verifyResetCode function) — added under the mobile namespace so the app doesn't
// have to call a non-mobile-prefixed route. The old web route is untouched.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const { email, code } = body ?? {};
    if (!email || !code) {
      return mobileError("Email and code are required", 400);
    }

    const result = await verifyResetCode(email, code);
    if (!result.ok) {
      return mobileError(result.message, result.status);
    }

    return mobileOk({ message: result.message });
  } catch (error: any) {
    return mobileError(error.message || "Internal Server Error", 500);
  }
}
