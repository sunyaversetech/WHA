import mongoose, { Schema, Document } from "mongoose";

export interface IDeal extends Document {
  title: string;
  image: string;
  expiryDate: Date;
  user: mongoose.Types.ObjectId;
  business_name: string;
}

const DealSchema = new Schema<IDeal>(
  {
    title: { type: String, required: true },
    image: { type: String, required: true },
    business_name: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    expiryDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value: Date) {
          const threeDaysFromNow = new Date();
          threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
          return value <= threeDaysFromNow;
        },
        message: "Expiry date cannot be more than 3 days from today.",
      },
    },
  },
  { timestamps: true },
);

export const Deal =
  mongoose.models.Deal || mongoose.model<IDeal>("Deal", DealSchema);
