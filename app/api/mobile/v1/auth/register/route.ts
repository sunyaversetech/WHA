import { NextRequest } from "next/server";
import { createCredentialsAccount } from "@/server/lib/accountCreation";
import { issueTokenPair } from "@/server/lib/mobileTokens";
import { toAuthUser } from "@/server/lib/authUser";
import { mobileOk, mobileError } from "@/server/lib/mobileResponse";
import { checkAuthAbuseLimit } from "@/server/lib/mobileRateLimit";
import { MobileAuthConfigError, assertMobileJwtConfigured } from "@/server/lib/mobileJwt";

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAuthAbuseLimit(req, "register");
    if (!allowed) {
      return mobileError("Too many registration attempts. Please try again later.", 429);
    }

    // Fail fast on a missing secret BEFORE creating anything — otherwise a
    // misconfigured server creates a real account and then can't issue tokens for
    // it, leaving the person unable to register again with that email and with
    // nothing to show for it either.
    try {
      assertMobileJwtConfigured();
    } catch (err: any) {
      if (err instanceof MobileAuthConfigError) return mobileError(err.message, 500);
      throw err;
    }

    const formData = await req.formData();
    const category =
      (formData.get("category") as string) === "business" ? "business" : "user";
    const deviceId = (formData.get("deviceId") as string) || undefined;
    const platform = (formData.get("platform") as string) || undefined;

    const result = await createCredentialsAccount(category, formData);
    if (!result.ok) {
      return mobileError(result.message, result.status);
    }

    // The account now exists — from here on we never delete it or treat a failure
    // as the registration itself having failed. If token issuance still fails for
    // some other reason (e.g. a transient DB error on the RefreshToken write), tell
    // the client the account is real and to log in instead, rather than a bare 500.
    try {
      const { accessToken, refreshToken, expiresIn } = await issueTokenPair(
        result.user,
        { deviceId, platform },
      );
      return mobileOk({
        accessToken,
        refreshToken,
        expiresIn,
        user: toAuthUser(result.user),
      }, null, 201);
    } catch {
      return mobileOk(
        { user: toAuthUser(result.user), tokens: null },
        { message: "Account created, please log in" },
        201,
      );
    }
  } catch (error: any) {
    if (error instanceof MobileAuthConfigError) {
      return mobileError(error.message, 500);
    }
    return mobileError(error.message || "Internal Server Error", 500);
  }
}
