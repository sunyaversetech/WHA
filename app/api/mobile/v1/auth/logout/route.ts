import { NextRequest } from "next/server";
import { connectToDb } from "@/lib/db";
import { revokeRefreshToken } from "@/server/lib/mobileTokens";
import { mobileOk, mobileError } from "@/server/lib/mobileResponse";

export async function POST(req: NextRequest) {
  try {
    await connectToDb();
    const body = await req.json().catch(() => null);
    const { refreshToken } = body ?? {};

    if (!refreshToken) {
      return mobileError("refreshToken is required", 400);
    }

    // Idempotent — logging out twice, or logging out a token that's already
    // expired/revoked, is not an error.
    await revokeRefreshToken(refreshToken);

    return mobileOk({ success: true });
  } catch (error: any) {
    return mobileError(error.message || "Internal Server Error", 500);
  }
}
