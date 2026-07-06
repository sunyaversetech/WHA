import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String },
    category: {
      type: String,
      enum: ["user", "business", "super-admin"],
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
    },
    city: { type: String },
    longitude: { type: Number },
    latitude: { type: Number },
    geo: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: [Number],
    },
    city_name: { type: String },
    location: { type: String },
    community: { type: [String], default: [] },
    image: { type: String },
    venue_images: { type: [String], default: [] },
    accpetalltermsandcondition: { type: Boolean, default: false },
    password: {
      type: String,
      required: function () {
        return this.provider === "credentials";
      },
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    provider: {
      type: String,
      default: "credentials",
      enum: ["credentials", "google"],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    business_name: { type: String, unique: true },
    business_type: {
      type: String,
      enum: ["employee_based", "item_based"],
      default: null,
    },
    phone_number: { type: String },
    business_category: { type: String },
    is24_7: { type: Boolean, default: false },
    schedule: { type: Schema.Types.Mixed, default: null },
    isblocked: { type: Boolean, default: false },
    abn_number: { type: String },
    verified: { type: Boolean, default: false },
    token: { type: String },
    verificationTokenExpire: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    isSponsor: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// 2dsphere index enables $geoNear aggregation for location-based queries.
UserSchema.index({ geo: "2dsphere" });

// Populate GeoJSON field whenever lat/lng are present on save.
// GeoJSON coordinates are [longitude, latitude] (note the order).
UserSchema.pre("save", async function () {
  if (this.latitude != null && this.longitude != null) {
    this.geo = { type: "Point", coordinates: [this.longitude, this.latitude] };
  } else {
    this.geo = undefined as any;
  }
});

const User = models.User || model("User", UserSchema);

export default User;
