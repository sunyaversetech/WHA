import mongoose from "mongoose";
import { Schema } from "mongoose";

export interface EventRedemptionSchema extends Document {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  uniqueKey: string;
  status: "pending" | "verified";
  verifiedAt?: Date;
}

const EventRedemptionSchema = new Schema<EventRedemptionSchema>(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    business: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uniqueKey: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "verified"], default: "pending" },
    verifiedAt: { type: Date },
  },
  { timestamps: true },
);

export const EventRedemption =
  mongoose.models.EventRedemption ||
  mongoose.model("EventRedemption", EventRedemptionSchema);
