import mongoose, { model, models } from "mongoose";

const availabilityDaySchema = new mongoose.Schema(
  {
    day_of_week: { type: String, required: true },
    is_available: { type: Boolean, default: true },
    start_time: { type: String, default: "09:00" },
    end_time: { type: String, default: "17:00" },
  },
  { _id: false },
);

const service_schema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true, ref: "User" },

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
    buffer_time: { type: Number, default: 0 },

    // Whether this service uses team members or a physical resource/space
    service_type: {
      type: String,
      enum: ["employee_based", "resource_based"],
      default: "employee_based",
    },

    // --- Employee-based fields ---
    require_employee_selection: { type: Boolean, default: false },
    assigned_employees: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    ],
    // Booking capacity (employee-based)
    allow_multiple_bookings: { type: Boolean, default: false },
    max_bookings_per_slot: { type: Number, default: 1, min: 1 },
    is_one_time_booking: { type: Boolean, default: false },

    // --- Resource-based fields ---
    availability_type: {
      type: String,
      enum: ["always", "specific"],
      default: "always",
    },
    availability_schedule: { type: [availabilityDaySchema], default: [] },
    // Capacity (resource-based)
    max_concurrent_bookings: { type: Number, default: 1, min: 1 },

    is_active: { type: Boolean, default: true },
    metadata: { type: Map, of: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

service_schema.index({ business_id: 1, category: 1 });
service_schema.index({ business_id: 1, name: 1 }, { unique: true });

// Always delete cached model so schema changes are picked up on hot-reload
delete (models as any).Service;
export const Service = model("Service", service_schema);
