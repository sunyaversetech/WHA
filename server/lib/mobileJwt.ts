import { SignJWT, jwtVerify, errors as joseErrors } from "jose";

// This file must import ONLY `jose` — nothing else. `proxy.ts` (Next's Edge-runtime
// middleware-equivalent) imports `verifyAccessToken` from here to key its rate
// limiter by user id when possible. The Edge runtime has no Node.js APIs, so this
// file must never pull in Mongoose, any `server/models/*`, or any other
// `server/lib/*` file that does — that's why token *issuance* (which needs the
// RefreshToken model) lives in the separate `mobileTokens.ts` instead, which imports
// *from* this file rather than the other way around.

const ACCESS_TOKEN_TTL = "15m";

export class MobileAuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MobileAuthConfigError";
  }
}

function getSecretKey(): Uint8Array {
  const secret = process.env.MOBILE_JWT_SECRET;
  if (!secret) {
    // Fail closed, with a message that's safe to surface as a 500 — never silently
    // fall back to another secret (e.g. NEXT_AUTH_SECRET) and never proceed unsigned.
    throw new MobileAuthConfigError(
      "Server misconfigured: MOBILE_JWT_SECRET is not set",
    );
  }
  return new TextEncoder().encode(secret);
}

export type MobileAccessTokenClaims = {
  sub: string; // User._id
  category: "user" | "business" | "super-admin";
};

export async function signAccessToken(
  claims: MobileAccessTokenClaims,
): Promise<{ accessToken: string; expiresIn: number }> {
  const key = getSecretKey();
  const accessToken = await new SignJWT({ category: claims.category })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(key);
  // Matches the "15m" TTL above in seconds, for clients that want an epoch/countdown
  // rather than parsing the JWT themselves.
  return { accessToken, expiresIn: 15 * 60 };
}

export async function verifyAccessToken(
  rawJwt: string,
): Promise<MobileAccessTokenClaims | null> {
  const key = getSecretKey();
  try {
    const { payload } = await jwtVerify(rawJwt, key, { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return {
      sub: payload.sub,
      category: payload.category as MobileAccessTokenClaims["category"],
    };
  } catch (err) {
    if (err instanceof joseErrors.JWTExpired) return null;
    if (err instanceof joseErrors.JWSSignatureVerificationFailed) return null;
    if (err instanceof MobileAuthConfigError) throw err;
    return null;
  }
}
