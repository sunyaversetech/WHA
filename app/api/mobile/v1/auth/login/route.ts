import { NextRequest } from "next/server";
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import bcrypt from "bcryptjs";
import { issueTokenPair } from "@/server/lib/mobileTokens";
import { toAuthUser } from "@/server/lib/authUser";
import { mobileOk, mobileError } from "@/server/lib/mobileResponse";
import { MobileAuthConfigError } from "@/server/lib/mobileJwt";

export async function POST(req: NextRequest) {
  try {
    await connectToDb();
    const body = await req.json().catch(() => null);
    const { email, password, category, deviceId, platform } = body ?? {};

    if (!email || !password || !category) {
      return mobileError("Email, password and category are required", 400);
    }
    if (category !== "user" && category !== "business") {
      return mobileError('category must be "user" or "business"', 400);
    }

    // Mirrors the two web Credentials providers exactly: "business" also matches a
    // super-admin account, "user" only matches category:"user".
    const categoryFilter =
      category === "business" ? { $in: ["business", "super-admin"] } : "user";

    const user = await User.findOne({
      email: String(email).toLowerCase(),
      category: categoryFilter,
    });

    if (!user || !user.password) {
      return mobileError("Invalid email or password", 401);
    }
    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      return mobileError("Invalid email or password", 401);
    }
    if (user.deletedAt) {
      return mobileError("This account no longer exists", 401);
    }
    if (user.isblocked) {
      return mobileError("This account has been blocked", 403);
    }
    if (!user.emailVerified) {
      return mobileError("Please verify your email before signing in", 403);
    }
    // NOTE: `verified` is intentionally NOT enforced as a login gate here — see the
    // Phase 1 rollout summary. Empirically, credentials-signup accounts never have
    // `verified` set true (only Google-originated or admin-approved business accounts
    // do), so gating login on it would lock out most real "user" accounts. It's still
    // returned on the user object for the client to use if relevant.

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
