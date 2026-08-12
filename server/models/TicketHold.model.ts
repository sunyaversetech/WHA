import mongoose, { Schema } from "mongoose";

export interface ITicketHoldItem {
  optionId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface ITicketHold {
  event: mongoose.Types.ObjectId;
  // Absent for guest (not-signed-in) checkouts — the hold still atomically
  // reserves inventory, it just isn't tied to an account until purchase.
  user?: mongoose.Types.ObjectId;
  items: ITicketHoldItem[];
  paymentIntentId: string;
  expiresAt: Date;
}

const TicketHoldItemSchema = new Schema<ITicketHoldItem>(
  {
    optionId: { type: Schema.Types.ObjectId, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false },
);

const TicketHoldSchema = new Schema<ITicketHold>(
  {
    event: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    items: {
      type: [TicketHoldItemSchema],
      required: true,
      validate: {
        validator: (items: ITicketHoldItem[]) => items.length > 0,
        message: "At least one held item is required",
      },
    },
    paymentIntentId: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL index: MongoDB's background sweep removes the document once
// expiresAt passes. Availability checks also filter on expiresAt directly
// since the TTL sweep runs on its own ~60s cycle, not instantly.
TicketHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const TicketHold =
  mongoose.models.TicketHold || mongoose.model("TicketHold", TicketHoldSchema);
