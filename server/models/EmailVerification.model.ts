import mongoose, { Schema } from "mongoose";

const EmailVerificationSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  code: { type: String, required: true },
  verified: { type: Boolean, default: false },
  attempts: { type: Number, default: 0 },
  expires_at: { type: Date, required: true },
});

// Mongo automatically deletes the document once expires_at is in the past.
EmailVerificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const EmailVerification =
  mongoose.models.EmailVerification ||
  mongoose.model("EmailVerification", EmailVerificationSchema);

export default EmailVerification;
