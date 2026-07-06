import mongoose from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true },
    name:        { type: String, required: true },
    color:       { type: String, default: "Blue" },
    description: { type: String, default: "" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

CategorySchema.index({ business_id: 1, name: 1 }, { unique: true });

const Category =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);

export default Category;
