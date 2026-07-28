import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema(
  {
    business_id: { type: String, required: true, index: true },
    type: { type: String, enum: ["appointment", "review"], required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    related_id: { type: Schema.Types.ObjectId, required: true },
    is_read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

NotificationSchema.index({ business_id: 1, is_read: 1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model("Notification", NotificationSchema);
export default Notification;
