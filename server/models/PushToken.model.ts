import mongoose, { Schema } from "mongoose";

// Expo push tokens registered by the mobile app (POST /api/mobile/v1/notifications/
// register-token). One document per device token; re-registering moves the token to
// whoever is signed in on that device now.
const PushTokenSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, enum: ["ios", "android"], required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

const PushToken = mongoose.models.PushToken || mongoose.model("PushToken", PushTokenSchema);
export default PushToken;
