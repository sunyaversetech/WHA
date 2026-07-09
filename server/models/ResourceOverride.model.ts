import mongoose, { model, models } from "mongoose";

const resource_override_schema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true },
    service_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
      required: true,
    },
    date: { type: String, required: true }, // "YYYY-MM-DD"
    is_closed: { type: Boolean, default: false },
    quantity_override: { type: Number, default: null },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

resource_override_schema.index({ service_id: 1, date: 1 }, { unique: true });
resource_override_schema.index({ business_id: 1, date: 1 });

delete (models as any).ResourceOverride;
export const ResourceOverride = model(
  "ResourceOverride",
  resource_override_schema,
);
