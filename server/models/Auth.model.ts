import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    image: { type: String },
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
  },
  { timestamps: true },
);

const User = models.User || model("User", UserSchema);

export default User;
