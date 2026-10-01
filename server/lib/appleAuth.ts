import { createRemoteJWKSet, jwtVerify } from "jose";
import User from "@/server/models/Auth.model";

const APPLE_JWKS = createRemoteJWKSet(
  new URL("https://appleid.apple.com/auth/keys"),
);

export class SocialAuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SocialAuthConfigError";
  }
}

export type AppleProfile = {
  sub: string;
  email?: string;
};

/**
 * Verifies an Apple ID token obtained natively on-device. Apple's id_token carries
 * `sub` (a stable, Apple-scoped user identifier) and usually `email` (a real address
 * or a private-relay address if the user chose "Hide My Email" — both work fine as an
 * account email), but never a display name — Apple only sends the name in the
 * client's separate `user` payload, and only on the very first authorization. Callers
 * must pass that along separately (see findOrCreateAppleUser's `name` param).
 */
export async function verifyAppleIdToken(idToken: string): Promise<AppleProfile> {
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId) {
    throw new SocialAuthConfigError(
      "Server misconfigured: APPLE_CLIENT_ID is not set",
    );
  }

  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: clientId,
  });

  if (!payload.sub) {
    throw new Error("Apple ID token missing required claims");
  }

  return {
    sub: payload.sub,
    email: typeof payload.email === "string" ? payload.email.toLowerCase() : undefined,
  };
}

/**
 * Mirrors findOrCreateGoogleUser's shape/restrictions exactly (category:"user" only;
 * see server/lib/googleAuth.ts for why this is a deliberate duplicate rather than a
 * shared function — there is no NextAuth Apple provider on the web to stay in sync
 * with, so this one has no "source of truth" elsewhere to duplicate from, but is kept
 * structurally identical for consistency).
 */
export async function findOrCreateAppleUser(profile: AppleProfile, name?: string) {
  // Apple accounts using "Hide My Email" still get a real (if relayed) address, but
  // guard anyway — without an email we have nothing to key the account on.
  if (!profile.email) {
    throw new Error("Apple did not provide an email for this sign-in");
  }

  let existing = await User.findOne({ email: profile.email });

  if (!existing) {
    existing = await User.create({
      name: name || "New User",
      email: profile.email,
      category: "user",
      provider: "apple",
      appleId: profile.sub,
      emailVerified: new Date(),
      verified: true,
    });
  } else {
    if (!existing.appleId) existing.appleId = profile.sub;
    if (!existing.emailVerified) existing.emailVerified = new Date();
    await existing.save();
  }

  return existing;
}
