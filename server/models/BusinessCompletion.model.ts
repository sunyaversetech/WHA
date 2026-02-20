import mongoose from "mongoose";

const SlotSchema = new mongoose.Schema({
  day: {
    type: String,
    required: true,
    enum: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
  },
  from: { type: String, required: true },
  to: { type: String, required: true },
});

const ResourceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true, default: 0 },
  available_slots: [SlotSchema],
  type: { type: String, required: true },
  booked_for: [{ type: Date }],
});

const ServiceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  item_description: { type: String },
  price_category: {
    type: String,
    required: true,
    enum: ["hr", "day", "monthly", "unit"],
    default: "hr",
  },
  resources: [ResourceSchema],
});

const BusinessSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
    },
    business_name: {
      type: String,
      required: true,
      trim: true,
    },
    business_category: {
      type: String,
      required: true,
    },
    service_category: {
      type: String,
      required: true,
    },
    business_service: [ServiceSchema],
    location: {
      address: { type: String, required: true },
      city: { type: String },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
  },
  {
    timestamps: true,
  },
);

const Business =
  mongoose.models.Business || mongoose.model("Business", BusinessSchema);

export default Business;
