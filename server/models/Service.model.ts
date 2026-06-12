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
    category: { type: String, required: true },

    base_price: { type: Number, required: true, min: 0 },
    base_duration: { type: Number, required: true },

    require_employee_selection: { type: Boolean, default: false },

    assigned_employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],

    is_active: { type: Boolean, default: true },
    metadata: { type: Map, of: String },
    buffer_time: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);

service_schema.index({ business_id: 1, category: 1 });
service_schema.index({ business_id: 1, name: 1 }, { unique: true });

// const Service = mongoose.model("Service", service_schema);
export const Service = models.Service || model("Service", service_schema);
