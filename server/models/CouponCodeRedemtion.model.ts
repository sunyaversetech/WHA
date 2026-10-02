import mongoose from "mongoose";
import { Schema } from "mongoose";

export interface IRedemption extends Document {
  deal: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  uniqueKeys: string[];
  status: "pending" | "verified";
  verifiedAt?: Date;
  paymentIntentId?: string;
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
    // Was previously passed to Redemption.create() but never declared on the
    // schema, so Mongoose's default strict mode silently dropped it — every paid
    // redemption's paymentIntentId was lost, making replay-protection impossible.
    paymentIntentId: { type: String, index: true },
  },
  { timestamps: true },
);

export const Redemption =
  mongoose.models.Redemption || mongoose.model("Redemption", RedemptionSchema);
