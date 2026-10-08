import mongoose, { Schema } from "mongoose";

export interface IDeal {
  title: string;
  slug?: string;
  valid_till: Date;
  deals_for: string;
  description: string;
  user: mongoose.Types.ObjectId;
  terms_for_the_deal: string;
  deal_code: string;
  max_redemptions: number;
  current_redemptions: number;
  category: string;
  city: string;
  image: File | string;
  price: number;
  discount_percentage: number;
}

const DealSchema = new Schema<IDeal>(
  {
    title: { type: String, required: true },
    // No `unique` constraint, deliberately — matches Event.slug's existing
    // convention (plain lowercase/alphanumeric, no collision suffix). A
    // collision here is no worse than the pre-existing risk in Event's own
    // slug lookup or the business fuzzy-name match; not introducing new
    // behavior, just extending the same established pattern.
    slug: { type: String, index: true },
    valid_till: {
      type: Date,
      required: true,
    },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    deals_for: { type: String },
    description: { type: String, required: true },
    city: { type: String, required: true },
    terms_for_the_deal: { type: String, required: true },
    deal_code: { type: String },
    category: { type: String, required: true },
    max_redemptions: { type: Number, required: true },
    current_redemptions: { type: Number, default: 0 },
    image: { type: String },
    price: { type: Number },
    discount_percentage: { type: Number },
  },
  { timestamps: true },
);

export const Deal =
  mongoose.models.Deal || mongoose.model<IDeal>("Deal", DealSchema);
