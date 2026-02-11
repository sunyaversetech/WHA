import mongoose, { Schema, model, models } from "mongoose";

const ResourceSchema = new Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  available_slots: {
    type: Map,
    of: String,
    default: { sun: "9Am - 5Pm" },
  },
  type: { type: String },
  booked_for: [{ type: String }],
});

const BusinessServiceSchema = new Schema({
  name: { type: String, required: true },
  item_description: { type: String },
  pricing_category: {
    type: String,
    enum: ["hr", "day", "monthly", "unit"],
    default: "hr",
  },
  resources: [ResourceSchema],
});

const ProfileSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    bio: { type: String },
    location: {
      address: { type: String },
      city: { type: String },
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },
    business_name: { type: String },
    business_category: { type: String },
    service_category: { type: String },
    business_service: [BusinessServiceSchema],

    isComplete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const Profile = models.Profile || model("Profile", ProfileSchema);

export default Profile;
