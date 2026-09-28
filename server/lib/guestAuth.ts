import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";
import User from "@/server/models/Auth.model";

// Matches NextAuth's default JWT session lifetime (session.maxAge default).
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export type GuestInfo = { name: string; email: string; phone: string };

/**
 * Extracted from the guest branch of app/api/event/ticket/purchase/route.ts (which
 * now calls this too, rather than inlining its own copy) so the mobile /auth/guest
 * endpoint shares the exact same find-or-create + security boundary: an existing
 * PASSWORD-PROTECTED account matched by email is used as the purchase's buyer, but
 * `canAutoSignIn` comes back false for it — callers must never issue a session/token
 * for an account they don't already own. Only a brand-new or already-passwordless
 * (Google/guest) account may be auto-signed-in.
 */
export async function findOrCreateGuestUser(
  guestInfo: GuestInfo,
): Promise<{ user: any; canAutoSignIn: boolean }> {
  const name = guestInfo.name.trim();
  const email = guestInfo.email.trim().toLowerCase();
  const phone = guestInfo.phone.trim();

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const canAutoSignIn = !existingUser.password;
    if (!existingUser.phone_number) {
      existingUser.phone_number = phone;
      await existingUser.save();
    }
    return { user: existingUser, canAutoSignIn };
  }

  const user = await User.create({
    name,
    email,
    phone_number: phone,
    category: "user",
    provider: "guest",
  });
  return { user, canAutoSignIn: true };
}

/**
 * Signs a NextAuth-compatible session cookie onto `response` for `user`,
 * without going through the normal provider sign-in flow. Used to
 * auto-login a guest checkout into the account their purchase was attached
 * to. The token shape must mirror what authOptions' jwt/session callbacks
 * populate on a real sign-in, or getServerSession/useSession will read it
 * back incorrectly.
 */
export async function attachAutoLoginCookie(response: NextResponse, user: any) {
  const token = {
    name: user.name,
    email: user.email,
    picture: user.image || null,
    sub: user._id.toString(),
    id: user._id.toString(),
    mongodbId: user._id.toString(),
    googleId: user.googleId ?? null,
    category: user.category,
    business_name: user.business_name,
    image: user.image,
    city_name: user.city_name,
    community_name: user.community_name,
    emailVerified: user.emailVerified ?? "",
    isblocked: user.isblocked ?? false,
    verified: user.verified ?? false,
    location: user.location ?? "",
    phone_number: user.phone_number ?? "",
    business_type: user.business_type ?? null,
  };

  const secret = process.env.NEXT_AUTH_SECRET!;
  const encoded = await encode({ token, secret, maxAge: SESSION_MAX_AGE });

  const isSecure = process.env.NEXTAUTH_URL?.startsWith("https://") ?? false;
  const cookieName = isSecure
    ? "__Secure-next-auth.session-token"
    : "next-auth.session-token";

  response.cookies.set(cookieName, encoded, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}
