import mongoose, { Schema } from "mongoose";

export interface IEventTicketLineItem {
  optionId: mongoose.Types.ObjectId;
  optionName: string;
  quantity: number;
  unitPrice: number;
  uniqueKeys: string[];
}

export interface IEventTicketPurchase {
  event: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  business: mongoose.Types.ObjectId;
  items: IEventTicketLineItem[];
  uniqueKeys: string[];
  verifiedKeys: string[];
  promoCode?: string;
  ticketTotal: number;
  serviceFee: number;
  surcharge: number;
  totalAmount: number;
  paymentIntentId: string;
  status: "pending" | "verified";
  verifiedAt?: Date;
}

const EventTicketLineItemSchema = new Schema<IEventTicketLineItem>(
  {
    optionId: { type: Schema.Types.ObjectId, required: true },
    optionName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    uniqueKeys: { type: [String], required: true },
  },
  { _id: false },
);

const EventTicketPurchaseSchema = new Schema<IEventTicketPurchase>(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    business: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: {
      type: [EventTicketLineItemSchema],
      required: true,
      validate: {
        validator: (items: IEventTicketLineItem[]) => items.length > 0,
        message: "At least one ticket item is required",
      },
    },
    uniqueKeys: {
      type: [String],
      required: true,
      validate: {
        validator: (keys: string[]) => keys.length > 0,
        message: "At least one unique key is required",
      },
    },
    verifiedKeys: { type: [String], default: [] },
    promoCode: { type: String },
    ticketTotal: { type: Number, required: true },
    serviceFee: { type: Number, required: true },
    surcharge: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    paymentIntentId: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "verified"], default: "pending" },
    verifiedAt: { type: Date },
  },
  { timestamps: true },
);

export const EventTicketPurchase =
  mongoose.models.EventTicketPurchase ||
  mongoose.model("EventTicketPurchase", EventTicketPurchaseSchema);
