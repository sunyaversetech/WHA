import { NextRequest } from "next/server";
import { connectToDb } from "@/lib/db";
import { verifyGoogleIdToken, findOrCreateGoogleUser, type GoogleProfile } from "@/server/lib/googleAuth";
import { verifyAppleIdToken, findOrCreateAppleUser, type AppleProfile } from "@/server/lib/appleAuth";
import { issueTokenPair } from "@/server/lib/mobileTokens";
import { toAuthUser } from "@/server/lib/authUser";
import { mobileOk, mobileError } from "@/server/lib/mobileResponse";
import { MobileAuthConfigError } from "@/server/lib/mobileJwt";

export async function POST(req: NextRequest) {
  await connectToDb();
  const body = await req.json().catch(() => null);
  const { idToken, provider, name, deviceId, platform } = body ?? {};

  if (!idToken || !provider) {
    return mobileError("idToken and provider are required", 400);
  }
  if (provider !== "google" && provider !== "apple") {
    return mobileError('provider must be "google" or "apple"', 400);
  }

  // Verification failures (bad signature, wrong audience, expired, misconfigured
  // client id) are kept separate from find-or-create failures below, so each gets
  // its own accurate message instead of one generic bucket.
  let profile: GoogleProfile | AppleProfile;
  try {
    profile =
      provider === "google"
        ? await verifyGoogleIdToken(idToken)
        : await verifyAppleIdToken(idToken);
  } catch (err: any) {
    if (err?.name === "SocialAuthConfigError") return mobileError(err.message, 500);
    return mobileError("Invalid or expired social sign-in token", 401);
  }

  let user: any;
  try {
    user =
      provider === "google"
        ? await findOrCreateGoogleUser(profile as GoogleProfile)
        : await findOrCreateAppleUser(profile as AppleProfile, name);
  } catch (err: any) {
    return mobileError(err.message || "Could not complete social sign-in", 400);
  }

  if (user.deletedAt) {
    return mobileError("This account no longer exists", 401);
  }
  if (user.isblocked) {
    return mobileError("This account has been blocked", 403);
  }

  try {
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
    if (error instanceof MobileAuthConfigError) return mobileError(error.message, 500);
    return mobileError(error.message || "Internal Server Error", 500);
  }
}
