import crypto from "crypto";
import { RefreshToken } from "@/server/models/RefreshToken.model";
import User from "@/server/models/Auth.model";
import { signAccessToken } from "./mobileJwt";
import type { AuthRejectReason } from "./authUser";

// Refresh-token issuance, rotation and revocation. This file imports Mongoose models
// and must never be imported from `proxy.ts` (Edge runtime) — that file imports only
// `mobileJwt.ts`, which this file itself imports *from*, never the other way around.

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const GRACE_WINDOW_MS = 30 * 1000; // racing-refresh tolerance

function sha256(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export type IssuedTokenPair = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

type DeviceInfo = { deviceId?: string; platform?: string };

/** Fresh login/register/social/guest issuance — no predecessor token involved. */
export async function issueTokenPair(
  user: { _id: any; category: "user" | "business" | "super-admin" },
  device: DeviceInfo = {},
): Promise<IssuedTokenPair> {
  const rawRefreshToken = crypto.randomBytes(64).toString("hex");
  await RefreshToken.create({
    tokenHash: sha256(rawRefreshToken),
    userId: user._id,
    deviceId: device.deviceId,
    platform: device.platform,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  const { accessToken, expiresIn } = await signAccessToken({
    sub: user._id.toString(),
    category: user.category,
  });
  return { accessToken, refreshToken: rawRefreshToken, expiresIn };
}

export type RotateResult =
  | { ok: true; pair: IssuedTokenPair }
  | { ok: false; reason: AuthRejectReason };

/**
 * Rotates a refresh token. Three outcomes:
 *  - Normal rotation: the presented token was still active — atomically revoke it
 *    and issue a new pair. The atomicity (single findOneAndUpdate guarded on
 *    revokedAt:null) means two simultaneous calls with the same token can never both
 *    win this branch.
 *  - Grace-window sibling: the presented token was *just* revoked (within 30s) by a
 *    rotation whose successor is still valid — likely a racing duplicate refresh call
 *    (e.g. foreground + background sync). Issue a brand-new sibling pair without
 *    touching the successor; both remain valid.
 *  - Reuse: revoked outside the grace window, or its successor is no longer valid —
 *    treat as a replayed/stolen token and revoke every other active token for that
 *    user, forcing re-login everywhere.
 * Returns a reason alongside `ok:false` in every non-happy-path case, so
 * /auth/refresh can return the same ACCOUNT_BLOCKED/ACCOUNT_NOT_FOUND/TOKEN_INVALID
 * codes /me does.
 */
export async function rotateRefreshToken(
  rawToken: string,
  device: DeviceInfo = {},
): Promise<RotateResult> {
  const presentedHash = sha256(rawToken);
  const newRawToken = crypto.randomBytes(64).toString("hex");
  const newHash = sha256(newRawToken);
  const now = new Date();

  const rotated = await RefreshToken.findOneAndUpdate(
    { tokenHash: presentedHash, revokedAt: null },
    { revokedAt: now, replacedByTokenHash: newHash },
  );

  if (rotated) {
    const user = await User.findById(rotated.userId);
    if (!user || user.deletedAt) return { ok: false, reason: "ACCOUNT_NOT_FOUND" };
    if (user.isblocked) return { ok: false, reason: "ACCOUNT_BLOCKED" };
    await RefreshToken.create({
      tokenHash: newHash,
      userId: rotated.userId,
      deviceId: device.deviceId ?? rotated.deviceId,
      platform: device.platform ?? rotated.platform,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    const { accessToken, expiresIn } = await signAccessToken({
      sub: rotated.userId.toString(),
      category: user.category,
    });
    return { ok: true, pair: { accessToken, refreshToken: newRawToken, expiresIn } };
  }

  // Not matched: never existed, or already revoked by an earlier rotation/sibling.
  const existing = await RefreshToken.findOne({ tokenHash: presentedHash });
  if (!existing || !existing.revokedAt) {
    return { ok: false, reason: "TOKEN_INVALID" };
  }

  const revokedMsAgo = now.getTime() - existing.revokedAt.getTime();
  if (revokedMsAgo <= GRACE_WINDOW_MS && existing.replacedByTokenHash) {
    const successor = await RefreshToken.findOne({
      tokenHash: existing.replacedByTokenHash,
    });
    const successorValid =
      successor && !successor.revokedAt && successor.expiresAt > now;

    if (successorValid) {
      const user = await User.findById(existing.userId);
      if (!user || user.deletedAt) return { ok: false, reason: "ACCOUNT_NOT_FOUND" };
      if (user.isblocked) return { ok: false, reason: "ACCOUNT_BLOCKED" };
      const siblingRawToken = crypto.randomBytes(64).toString("hex");
      await RefreshToken.create({
        tokenHash: sha256(siblingRawToken),
        userId: existing.userId,
        deviceId: device.deviceId ?? existing.deviceId,
        platform: device.platform ?? existing.platform,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      });
      const { accessToken, expiresIn } = await signAccessToken({
        sub: existing.userId.toString(),
        category: user.category,
      });
      return {
        ok: true,
        pair: { accessToken, refreshToken: siblingRawToken, expiresIn },
      };
    }
  }

  // Genuine reuse of a dead token — revoke the whole family as a compromise signal.
  await RefreshToken.updateMany(
    { userId: existing.userId, revokedAt: null },
    { revokedAt: now },
  );
  return { ok: false, reason: "TOKEN_INVALID" };
}

/** Logout — idempotent, never errors if the token is already gone/revoked. */
export async function revokeRefreshToken(rawToken: string): Promise<void> {
  await RefreshToken.updateOne(
    { tokenHash: sha256(rawToken), revokedAt: null },
    { revokedAt: new Date() },
  );
}

/** Used by account deletion to kill every session on every device immediately. */
export async function revokeAllRefreshTokensForUser(userId: any): Promise<void> {
  await RefreshToken.updateMany(
    { userId, revokedAt: null },
    { revokedAt: new Date() },
  );
}
