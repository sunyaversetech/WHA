import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { verifyAccessToken } from "./mobileJwt";
import { toAuthUser, type AuthUser } from "./authUser";

export type AuthRejectReason = "TOKEN_INVALID" | "ACCOUNT_BLOCKED" | "ACCOUNT_NOT_FOUND";

export type AuthUserResult =
  | { user: AuthUser; reason?: undefined }
  | { user: null; reason: AuthRejectReason };

/**
 * The single identity check both the web app's session cookie and the mobile app's
 * bearer token go through. Tries the existing NextAuth session first (read-only —
 * this never touches app/api/auth/[...nextauth]/route.ts), falling back to an
 * `Authorization: Bearer` header. Either path does a FRESH read of the user from
 * Mongo (not just the token's own claims) — this is stricter than the old per-route
 * session checks it replaces, which trusted whatever `isblocked` value happened to
 * be baked into the (possibly stale) JWT session cookie. See the behavior-change
 * note in the Phase 1 rollout summary.
 *
 * Returns a *reason* alongside the null so mobile-facing routes (currently just
 * GET/DELETE /me) can return a specific error code — ACCOUNT_BLOCKED (403),
 * ACCOUNT_NOT_FOUND (401, covers both "deleted" and "no such user"), or
 * TOKEN_INVALID (401, covers a missing/malformed/expired token and no credentials
 * at all — a mobile client should treat both the same way: re-authenticate).
 * The 11 already-swapped consumer routes (tickets, favroite, review*, event
 * redeem/ticket/hold/purchase, user profile/update) use the plain `getAuthUser`
 * wrapper below and never see this detail — their web response shape is
 * deliberately unchanged from before this phase.
 *
 * A misconfigured MOBILE_JWT_SECRET throws (MobileAuthConfigError) rather than being
 * swallowed into a generic rejection, so it surfaces as a clear 500 via each route's
 * own catch block instead of masquerading as "not logged in".
 */
export async function getAuthUserDetailed(req: Request): Promise<AuthUserResult> {
  await connectToDb();

  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const dbUser = await User.findById(session.user.id);
    if (!dbUser || dbUser.deletedAt) return { user: null, reason: "ACCOUNT_NOT_FOUND" };
    if (dbUser.isblocked) return { user: null, reason: "ACCOUNT_BLOCKED" };
    return { user: toAuthUser(dbUser) };
  }

  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const rawToken = authHeader.slice("Bearer ".length).trim();
    const claims = await verifyAccessToken(rawToken);
    if (!claims) return { user: null, reason: "TOKEN_INVALID" };
    const dbUser = await User.findById(claims.sub);
    if (!dbUser || dbUser.deletedAt) return { user: null, reason: "ACCOUNT_NOT_FOUND" };
    if (dbUser.isblocked) return { user: null, reason: "ACCOUNT_BLOCKED" };
    return { user: toAuthUser(dbUser) };
  }

  return { user: null, reason: "TOKEN_INVALID" };
}

/**
 * Thin wrapper preserving the original `AuthUser | null` shape — every already-
 * swapped consumer route keeps calling this exact function, unchanged, so their
 * web response bodies are provably identical to before this phase.
 */
export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  const result = await getAuthUserDetailed(req);
  return result.user;
}
