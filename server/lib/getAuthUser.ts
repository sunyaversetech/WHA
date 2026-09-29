import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { verifyAccessToken } from "./mobileJwt";
import { toAuthUser, type AuthUser, type AuthRejectReason } from "./authUser";

// Re-exported for existing importers (e.g. /me/route.ts) — the type now lives in
// authUser.ts so mobileTokens.ts can share it without importing this file.
export type { AuthRejectReason };

export type AuthUserResult =
  | { user: AuthUser; reason?: undefined; viaBearer: boolean }
  | { user: null; reason: AuthRejectReason; viaBearer: boolean };

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
 * Returns a *reason* alongside the null so mobile-facing routes can return a specific
 * error code — ACCOUNT_BLOCKED (403), ACCOUNT_NOT_FOUND (401, covers both "deleted"
 * and "no such user"), or TOKEN_INVALID (401, covers a missing/malformed/expired
 * token and no credentials at all). `viaBearer` is true only when an
 * `Authorization: Bearer` header was actually present (regardless of whether it
 * turned out valid) — routes use this to decide whether a rejection reached them via
 * a mobile bearer attempt (safe to attach the detailed code) or the web session-
 * cookie path / no credentials at all (must keep the exact pre-existing response
 * shape, per the "don't change web behavior" rule).
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
    if (!dbUser || dbUser.deletedAt) {
      return { user: null, reason: "ACCOUNT_NOT_FOUND", viaBearer: false };
    }
    if (dbUser.isblocked) {
      return { user: null, reason: "ACCOUNT_BLOCKED", viaBearer: false };
    }
    return { user: toAuthUser(dbUser), viaBearer: false };
  }

  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  const viaBearer = !!authHeader?.startsWith("Bearer ");

  if (viaBearer) {
    const rawToken = authHeader!.slice("Bearer ".length).trim();
    const claims = await verifyAccessToken(rawToken);
    if (!claims) return { user: null, reason: "TOKEN_INVALID", viaBearer };
    const dbUser = await User.findById(claims.sub);
    if (!dbUser || dbUser.deletedAt) {
      return { user: null, reason: "ACCOUNT_NOT_FOUND", viaBearer };
    }
    if (dbUser.isblocked) {
      return { user: null, reason: "ACCOUNT_BLOCKED", viaBearer };
    }
    return { user: toAuthUser(dbUser), viaBearer };
  }

  return { user: null, reason: "TOKEN_INVALID", viaBearer: false };
}

/**
 * Thin wrapper preserving the original `AuthUser | null` shape — every already-
 * swapped consumer route that doesn't need the detailed reason keeps calling this
 * exact function, unchanged, so their web response bodies are provably identical to
 * before this phase.
 */
export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  const result = await getAuthUserDetailed(req);
  return result.user;
}

/**
 * The NextResponse for a bearer-token rejection, used ONLY when
 * `getAuthUserDetailed`'s result has `viaBearer: true` — the web (cookie or no
 * credentials) case must keep using each route's own pre-existing response
 * unchanged, never this. `messageKey` matches whichever top-level field that
 * specific route already used for its error string ("error" or "message"), so the
 * only thing that changes for the mobile bearer path is that field's value going
 * from a bare string to `{message, code}`.
 */
export function bearerRejectionResponse(
  reason: AuthRejectReason,
  messageKey: "error" | "message" = "error",
): NextResponse {
  const status = reason === "ACCOUNT_BLOCKED" ? 403 : 401;
  return NextResponse.json(
    { [messageKey]: { message: "Unauthorized", code: reason } },
    { status },
  );
}
