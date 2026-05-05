import mongoose from "mongoose";
import { Schema } from "mongoose";

export interface IRedemption extends Document {
  deal: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  uniqueKeys: string[];
  status: "pending" | "verified";
  verifiedAt?: Date;
}

const RedemptionSchema = new Schema<IRedemption>(
  {
    deal: { type: Schema.Types.ObjectId, ref: "Deal", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    business: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uniqueKeys: {
      type: [String],
      required: true,
      validate: {
        validator: (keys: string[]) => keys.length > 0,
        message: "At least one unique key is required",
      },
    },
    status: { type: String, enum: ["pending", "verified"], default: "pending" },
    verifiedAt: { type: Date },
  },
  { timestamps: true },
);

export const Redemption =
  mongoose.models.Redemption || mongoose.model("Redemption", RedemptionSchema);
