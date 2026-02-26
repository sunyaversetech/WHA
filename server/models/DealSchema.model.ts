import mongoose, { Schema } from "mongoose";

export interface IDeal {
  title: string;
  valid_till: Date;
  deals_for: string;
  description: string;
  user: mongoose.Types.ObjectId;
  terms_for_the_deal: string;
  deal_code: string;
}

const DealSchema = new Schema<IDeal>(
  {
    title: { type: String, required: true },
    valid_till: {
      type: Date,
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    deals_for: { type: String, required: true },
    description: { type: String, required: true },
    terms_for_the_deal: { type: String, required: true },
    deal_code: { type: String, required: true },
  },
  { timestamps: true },
);

export const Deal =
  mongoose.models.Deal || mongoose.model<IDeal>("Deal", DealSchema);
