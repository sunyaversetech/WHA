import { Schema, model, models, Document } from "mongoose";

const ServiceSchema = new Schema(
  {
    service_name: { type: String, required: true },
    assigned_to: { type: String, required: true },
    price: { type: Number, required: true },
    pricing_category: {
      type: String,
      enum: ["hour", "day", "month"],
      default: "hour",
    },
    day_from: { type: String, required: true },
    day_to: { type: String, required: true },
    time_from: { type: String, required: true },
    time_to: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const CategorySchema = new Schema(
  {
    name: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

export const Category = models.Category || model("Category", CategorySchema);
export const Service = models.Service || model("Service", ServiceSchema);
