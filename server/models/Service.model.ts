import mongoose, { model, models } from "mongoose";

const service_schema = new mongoose.Schema(
  {
    business_id: {
      type: String,
      required: true,
      index: true,
      ref: "User",
    },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, default: "" },
    category_id: { type: String, default: null },

    price_type: {
      type: String,
      enum: ["Fixed", "From", "Free", "Custom"],
      default: "Fixed",
    },

    base_price: { type: Number, required: true, min: 0 },
    base_duration: { type: Number, required: true },
    require_employee_selection: { type: Boolean, default: false },

    business_type: {
      type: String,
      enum: ["employee_based", "item_based"],
      default: "employee_based",
      required: true,
    },

    slot_interval: {
      type: Number,
      default: null,
    },

    assigned_employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],

    is_active: { type: Boolean, default: true },
    metadata: { type: Map, of: String },
    buffer_time: { type: Number, default: 0 },

    // inventory is only meaningful when business_type === "item_based"
    inventory: { type: Number, default: 0 },

    // Allows more than one customer to book the same service at the same time slot
    allow_multiple_bookings: { type: Boolean, default: false },
    // Max number of concurrent bookings permitted per slot when allow_multiple_bookings is true
    max_bookings_per_slot: { type: Number, default: 1, min: 1 },
    // A one-off service (e.g. a single event) — once its slot fills up, it is auto-deactivated
    is_one_time_booking: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

service_schema.index({ business_id: 1, category: 1 });
service_schema.index({ business_id: 1, name: 1 }, { unique: true });

export const Service = models.Service || model("Service", service_schema);
