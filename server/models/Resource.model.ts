import mongoose, { model, models } from "mongoose";

const availabilityDaySchema = new mongoose.Schema(
  {
    day_of_week:  { type: String, required: true },
    is_available: { type: Boolean, default: true },
    start_time:   { type: String, default: "09:00" },
    end_time:     { type: String, default: "17:00" },
  },
  { _id: false },
);

const resource_schema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true, ref: "User" },

    name:        { type: String, required: true },
    description: { type: String, default: "" },
    category_id: { type: String, default: null },
    category:    { type: String, default: "" },

    price_type: {
      type:    String,
      enum:    ["Fixed", "From", "Free", "Custom"],
      default: "Fixed",
    },
    base_price:    { type: Number, default: 0, min: 0 },
    base_duration: { type: Number, default: 60 },
    buffer_time:   { type: Number, default: 0 },

    // "always" = always bookable; "specific" = only on configured days/times
    availability_type: {
      type:    String,
      enum:    ["always", "specific"],
      default: "always",
    },
    availability_schedule: { type: [availabilityDaySchema], default: [] },

    // Capacity
    allow_multiple_bookings: { type: Boolean, default: false },
    max_concurrent_bookings: { type: Number,  default: 1, min: 1 },

    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

resource_schema.index({ business_id: 1, name: 1 }, { unique: true });

export const Resource = models.Resource || model("Resource", resource_schema);
