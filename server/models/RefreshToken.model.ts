import mongoose, { Schema } from "mongoose";

export interface IRefreshToken {
  tokenHash: string; // sha256 of the raw opaque token — the raw value is never stored
  userId: mongoose.Types.ObjectId;
  deviceId?: string;
  platform?: string;
  expiresAt: Date;
  revokedAt?: Date | null;
  // Set when this token is rotated (its successor's hash), so grace-window /
  // reuse-detection logic can walk the chain without needing the raw value.
  replacedByTokenHash?: string | null;
}

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    tokenHash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    deviceId: { type: String },
    platform: { type: String },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByTokenHash: { type: String, default: null },
  },
  { timestamps: true },
);

// Mongo automatically drops the document once expiresAt is in the past — same TTL
// pattern used by TicketHold and EmailVerification elsewhere in this codebase.
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken =
  mongoose.models.RefreshToken ||
  mongoose.model("RefreshToken", RefreshTokenSchema);
