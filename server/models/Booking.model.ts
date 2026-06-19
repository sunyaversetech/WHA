import mongoose from "mongoose";

const booking_schema = new mongoose.Schema(
  {
    // Identification
    business_id: {
      type: String,
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    idempotency_key: {
      type: String,
      default: null,
      index: true, // Fast lookup on retry
    },

    inventory_quantity: {
      type: Number,
      default: null, // null for employee-based bookings; a number for item-based
    },

    start_time: { type: Date, required: true },
    end_time: { type: Date, required: true },
    duration: { type: Number, required: true }, // minutes

    total_price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "AUD" },
    payment_status: {
      type: String,
      enum: ["unpaid", "pending", "paid", "refunded", "failed"],
      default: "unpaid",
    },
    payment_transaction_id: { type: String },

    // Booking State
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
        "refunded",
      ],
      default: "pending",
    },

    notes: { type: String },
    metadata: {
      type: Map,
      of: String,
    },

    is_reminder_sent: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

booking_schema.index({ employee_id: 1, start_time: 1, end_time: 1 });
booking_schema.index({ business_id: 1, status: 1 });
booking_schema.index(
  { idempotency_key: 1, user_id: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotency_key: { $ne: null } },
    name: "unique_idempotency_per_user",
  },
);

const Booking =
  mongoose.models.Booking || mongoose.model("Booking", booking_schema);
export default Booking;
