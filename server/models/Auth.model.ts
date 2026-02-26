import { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String },
    category: {
      type: String,
      enum: ["user", "business"],
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
    },
    city: { type: String },
    city_name: { type: String },
    location: { type: String },
    community: { type: String },
    community_name: { type: String },
    image: { type: String },
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
    business_name: { type: String },
    business_category: { type: String },
    abn_number: { type: String },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const User = models.User || model("User", UserSchema);

export default User;
