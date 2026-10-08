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
    portfolio_images: { type: [String], default: [] },
    accpetalltermsandcondition: { type: Boolean, default: false },
    password: {
      type: String,
      required: function (this: any) {
        return this.provider === "credentials";
      },
      select: false,
    },
    emailVerified: {
      type: Date,
      default: null,
    },
    provider: {
      type: String,
      default: "credentials",
      enum: ["credentials", "google", "apple", "guest"],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // No `default` here, deliberately — matching googleId above. A sparse+unique
    // index only excludes documents where the field is genuinely ABSENT; a default
    // of `null` would make every account without an Apple ID collide on the same
    // indexed null value.
    appleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    // sparse: true (added — pre-existing bug found via mobile-auth testing): without
    // it, every "user"/guest account (which never sets business_name) collides on
    // the same implicit indexed `null` value, so only the very first such account
    // could ever be created — every one after it failed with an E11000 duplicate
    // key error. This affected the existing web guest-checkout flow identically,
    // not just the new mobile /auth/guest endpoint.
    business_name: { type: String, unique: true, sparse: true },
    // Derived from business_name at creation time (see server/lib/slug.ts).
    // No `unique` constraint — business_name's own uniqueness makes a slug
    // collision rare (only when two distinct names collapse to the same
    // alphanumeric string), and this mirrors Event.slug's existing,
    // already-accepted convention rather than introducing a new creation-
    // failure mode for that edge case. `index` (not sparse+unique) is enough
    // for the lookup speed this exists for.
    slug: { type: String, index: true },
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
    seo_keywords: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 10,
        message: "You can add up to 10 SEO keywords",
      },
    },
    seo_description: { type: String, maxlength: 200, default: "" },
    verified: { type: Boolean, default: false },
    token: { type: String, select: false },
    verificationTokenExpire: { type: Date },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date },
    isSponsor: { type: Boolean, default: false },
    // Set by the mobile DELETE /me flow (server/lib/accountDeletion.ts). The account
    // row and its _id are kept (so every existing Booking/EventTicketPurchase/Review
    // reference stays valid) but PII is wiped and login is blocked once this is set —
    // see getAuthUser.ts and each mobile auth route for the enforcement points.
    deletedAt: { type: Date, default: null },
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
