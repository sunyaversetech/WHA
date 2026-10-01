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
    }).select("+password");

    if (!user || !user.password) {
      return mobileError("Invalid email or password", 401);
    }
    const passwordOk = await bcrypt.compare(password, user.password);
    if (!passwordOk) {
      return mobileError("Invalid email or password", 401);
    }
    // Deliberately no isblocked / emailVerified / verified gate here — verified
    // against the actual web Credentials providers' authorize() functions
    // (app/api/auth/[...nextauth]/route.ts:42-53,63-74), which check ONLY category,
    // password presence, and the bcrypt compare above. Web issues a session to a
    // blocked or email-unverified account the same way it issues one to any other —
    // enforcement happens per-request (getAuthUser rejects isblocked/deletedAt on
    // every subsequent call, on both the web and mobile paths), not at sign-in. A
    // deleted account is unreachable here anyway: its email was overwritten to a
    // placeholder on deletion, so this exact lookup naturally finds nothing for it.

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
