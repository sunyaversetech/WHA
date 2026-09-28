import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { verifyAccessToken } from "./mobileJwt";
import { toAuthUser, type AuthUser } from "./authUser";

/**
 * The single identity check both the web app's session cookie and the mobile app's
 * bearer token can go through. Tries the existing NextAuth session first (read-only —
 * this never touches app/api/auth/[...nextauth]/route.ts), falling back to an
 * `Authorization: Bearer` header. Either path does a FRESH read of the user from
 * Mongo (not just the token's own claims) and rejects if the account is blocked or
 * has been deleted (see server/lib/accountDeletion.ts) — this is stricter than the
 * old per-route session checks it replaces, which trusted whatever `isblocked` value
 * happened to be baked into the (possibly stale) JWT session cookie. See the
 * behavior-change note in the Phase 1 rollout summary.
 *
 * A misconfigured MOBILE_JWT_SECRET throws (MobileAuthConfigError) rather than being
 * swallowed into a generic 401, so it surfaces as a clear 500 via each route's own
 * catch block instead of masquerading as "not logged in".
 */
export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  await connectToDb();

  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    const dbUser = await User.findById(session.user.id);
    if (!dbUser || dbUser.isblocked || dbUser.deletedAt) return null;
    return toAuthUser(dbUser);
  }

  const authHeader =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const rawToken = authHeader.slice("Bearer ".length).trim();
    const claims = await verifyAccessToken(rawToken);
    if (!claims) return null;
    const dbUser = await User.findById(claims.sub);
    if (!dbUser || dbUser.isblocked || dbUser.deletedAt) return null;
    return toAuthUser(dbUser);
  }

  return null;
}
