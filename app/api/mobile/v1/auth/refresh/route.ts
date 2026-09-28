import { NextRequest } from "next/server";
import { connectToDb } from "@/lib/db";
import { rotateRefreshToken } from "@/server/lib/mobileTokens";
import { mobileOk, mobileError } from "@/server/lib/mobileResponse";
import { MobileAuthConfigError } from "@/server/lib/mobileJwt";

export async function POST(req: NextRequest) {
  try {
    await connectToDb();
    const body = await req.json().catch(() => null);
    const { refreshToken, deviceId, platform } = body ?? {};

    if (!refreshToken) {
      return mobileError("refreshToken is required", 400);
    }

    const pair = await rotateRefreshToken(refreshToken, { deviceId, platform });
    if (!pair) {
      return mobileError("Invalid or expired refresh token", 401);
    }

    return mobileOk(pair);
  } catch (error: any) {
    if (error instanceof MobileAuthConfigError) {
      return mobileError(error.message, 500);
    }
    return mobileError(error.message || "Internal Server Error", 500);
  }
}
