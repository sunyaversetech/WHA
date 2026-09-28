import { NextRequest } from "next/server";
import { connectToDb } from "@/lib/db";
import { findOrCreateGuestUser } from "@/server/lib/guestAuth";
import { issueTokenPair } from "@/server/lib/mobileTokens";
import { toAuthUser } from "@/server/lib/authUser";
import { mobileOk, mobileError } from "@/server/lib/mobileResponse";
import { checkAuthAbuseLimit } from "@/server/lib/mobileRateLimit";
import { MobileAuthConfigError } from "@/server/lib/mobileJwt";

/**
 * Mobile equivalent of server/lib/guestAuth.ts's attachAutoLoginCookie — issues
 * tokens instead of a cookie. Shares the exact same find-or-create + security
 * boundary as the web guest-checkout flow: an existing password-protected account
 * matched by email is never auto-signed-into.
 */
export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAuthAbuseLimit(req, "guest");
    if (!allowed) {
      return mobileError("Too many attempts. Please try again later.", 429);
    }

    await connectToDb();
    const body = await req.json().catch(() => null);
    const { name, email, phone, deviceId, platform } = body ?? {};

    if (!name?.trim() || !email?.trim() || !phone?.trim()) {
      return mobileError("Name, email and phone are required", 400);
    }

    const { user, canAutoSignIn } = await findOrCreateGuestUser({
      name,
      email,
      phone,
    });

    if (!canAutoSignIn) {
      return mobileError(
        "An account already exists for this email. Please log in instead.",
        409,
      );
    }
    if (user.deletedAt) {
      return mobileError("This account no longer exists", 401);
    }
    if (user.isblocked) {
      return mobileError("This account has been blocked", 403);
    }

    const { accessToken, refreshToken, expiresIn } = await issueTokenPair(user, {
      deviceId,
      platform,
    });

    return mobileOk({
      accessToken,
      refreshToken,
      expiresIn,
      user: toAuthUser(user),
    });
  } catch (error: any) {
    if (error instanceof MobileAuthConfigError) {
      return mobileError(error.message, 500);
    }
    return mobileError(error.message || "Internal Server Error", 500);
  }
}
