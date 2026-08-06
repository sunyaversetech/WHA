import mongoose, { Schema } from "mongoose";

export interface IEventTicketPurchase {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  quantity: number;
  unitPrice: number;
  serviceFee: number;
  surcharge: number;
  totalAmount: number;
  uniqueKeys: string[];
  verifiedKeys: string[];
  paymentIntentId: string;
  status: "pending" | "verified";
  verifiedAt?: Date;
}

const EventTicketPurchaseSchema = new Schema<IEventTicketPurchase>(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    business: { type: Schema.Types.ObjectId, ref: "User", required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    serviceFee: { type: Number, required: true },
    surcharge: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    uniqueKeys: {
      type: [String],
      required: true,
      validate: {
        validator: (keys: string[]) => keys.length > 0,
        message: "At least one unique key is required",
      },
    },
    verifiedKeys: { type: [String], default: [] },
    paymentIntentId: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "verified"], default: "pending" },
    verifiedAt: { type: Date },
  },
  { timestamps: true },
);

export const EventTicketPurchase =
  mongoose.models.EventTicketPurchase ||
  mongoose.model("EventTicketPurchase", EventTicketPurchaseSchema);
