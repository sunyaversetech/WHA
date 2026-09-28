import { NextRequest } from "next/server";
import { createCredentialsAccount } from "@/server/lib/accountCreation";
import { issueTokenPair } from "@/server/lib/mobileTokens";
import { toAuthUser } from "@/server/lib/authUser";
import { mobileOk, mobileError } from "@/server/lib/mobileResponse";
import { checkAuthAbuseLimit } from "@/server/lib/mobileRateLimit";
import { MobileAuthConfigError } from "@/server/lib/mobileJwt";

export async function POST(req: NextRequest) {
  try {
    const allowed = await checkAuthAbuseLimit(req, "register");
    if (!allowed) {
      return mobileError("Too many registration attempts. Please try again later.", 429);
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

    const { accessToken, refreshToken, expiresIn } = await issueTokenPair(
      result.user,
      { deviceId, platform },
    );

    return mobileOk({
      accessToken,
      refreshToken,
      expiresIn,
      user: toAuthUser(result.user),
    });
  } catch (error: any) {
    if (error instanceof MobileAuthConfigError) {
      return mobileError(error.message, 500);
    }
    return mobileError(error.message || "Internal Server Error", 500);
  }
}
