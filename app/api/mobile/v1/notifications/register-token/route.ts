import { NextRequest } from "next/server";
import { getAuthUserDetailed, type AuthRejectReason } from "@/server/lib/getAuthUser";
import { mobileOk, mobileError } from "@/server/lib/mobileResponse";
import { MobileAuthConfigError } from "@/server/lib/mobileJwt";
import PushToken from "@/server/models/PushToken.model";

// POST   { token, platform } — register this device's Expo push token for the user.
// DELETE { token }           — unregister it (call on logout, before dropping tokens).

const EXPO_TOKEN_RE = /^Expo(nent)?PushToken\[[^\]]+\]$/;

function statusForReason(reason: AuthRejectReason): number {
  return reason === "ACCOUNT_BLOCKED" ? 403 : 401;
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUserDetailed(req);
    if (!auth.user) {
      return mobileError("Unauthorized", statusForReason(auth.reason), null, auth.reason);
    }

    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const platform = body?.platform;

    if (!EXPO_TOKEN_RE.test(token)) {
      return mobileError("A valid Expo push token is required", 400, null, "VALIDATION_ERROR");
    }
    if (platform !== "ios" && platform !== "android") {
      return mobileError('platform must be "ios" or "android"', 400, null, "VALIDATION_ERROR");
    }

    await PushToken.findOneAndUpdate(
      { token },
      { user_id: auth.user.id, platform },
      { upsert: true, setDefaultsOnInsert: true },
    );
    return mobileOk({ registered: true });
  } catch (error: any) {
    if (error instanceof MobileAuthConfigError) return mobileError(error.message, 500);
    return mobileError(error.message || "Internal Server Error", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthUserDetailed(req);
    if (!auth.user) {
      return mobileError("Unauthorized", statusForReason(auth.reason), null, auth.reason);
    }

    const body = await req.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!token) {
      return mobileError("token is required", 400, null, "VALIDATION_ERROR");
    }

    const result = await PushToken.deleteOne({ token, user_id: auth.user.id });
    return mobileOk({ removed: result.deletedCount > 0 });
  } catch (error: any) {
    if (error instanceof MobileAuthConfigError) return mobileError(error.message, 500);
    return mobileError(error.message || "Internal Server Error", 500);
  }
}
