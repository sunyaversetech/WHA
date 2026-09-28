import { createRemoteJWKSet, jwtVerify } from "jose";
import User from "@/server/models/Auth.model";

const GOOGLE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/oauth2/v3/certs"),
);

export class SocialAuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SocialAuthConfigError";
  }
}

export type GoogleProfile = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
};

/**
 * Verifies a Google ID token obtained natively on-device (iOS/Android/web client),
 * accepting whichever of the three platform client IDs are configured.
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  const audiences = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
  ].filter((v): v is string => !!v);

  if (audiences.length === 0) {
    throw new SocialAuthConfigError(
      "Server misconfigured: no Google client ID configured (GOOGLE_CLIENT_ID / GOOGLE_IOS_CLIENT_ID / GOOGLE_ANDROID_CLIENT_ID)",
    );
  }

  const { payload } = await jwtVerify(idToken, GOOGLE_JWKS, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: audiences,
  });

  if (!payload.sub || typeof payload.email !== "string") {
    throw new Error("Google ID token missing required claims");
  }

  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    name: typeof payload.name === "string" ? payload.name : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
  };
}

/**
 * A deliberate DUPLICATE of the find-or-create block inside authOptions'
 * `signIn` callback for the Google provider
 * (app/api/auth/[...nextauth]/route.ts:82-124) — not an extraction, so that file
 * stays completely untouched (see the Phase 1 plan). Keep this in sync by hand if
 * the web behavior ever changes. Restriction preserved exactly: only a
 * category:"user" account is ever auto-created here — business accounts must go
 * through the dedicated signup flow, never through social sign-in.
 */
export async function findOrCreateGoogleUser(profile: GoogleProfile) {
  let existing = await User.findOne({ email: profile.email });

  if (!existing) {
    existing = await User.create({
      name: profile.name || "New User",
      email: profile.email,
      image: profile.picture || undefined,
      category: "user",
      provider: "google",
      googleId: profile.sub,
      emailVerified: new Date(),
      verified: true,
    });
  } else if (!existing.emailVerified) {
    existing.emailVerified = new Date();
    await existing.save();
  }

  return existing;
}
