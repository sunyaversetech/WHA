import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

// Matches NextAuth's default JWT session lifetime (session.maxAge default).
const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

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
