import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { sendSimpleMail } from "@/lib/mail";
import bcrypt from "bcryptjs";

// Extracted verbatim from the existing app/api/reset-password, app/api/auth/verify-code
// and app/api/auth/update-password routes, which now call these instead of inlining
// their own copies. Response messages/status codes are preserved exactly.

type Result =
  | { ok: true; message: string }
  | { ok: false; status: number; message: string };

export async function sendResetCode(rawEmail: string): Promise<Result> {
  await connectToDb();
  const email = rawEmail?.trim().toLowerCase();
  if (!email) return { ok: false, status: 400, message: "Email is required" };

  const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
  const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

  const user = await User.findOneAndUpdate(
    { email },
    { $set: { resetPasswordToken: resetCode, resetPasswordExpire } },
    { new: true, runValidators: false },
  );
  if (!user) return { ok: false, status: 404, message: "User not found" };

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #1e293b;">Password Reset Request</h2>
        <p style="color: #64748b;">Use the code below to reset your password. This code expires in 10 minutes.</p>
      </div>
      <div style="background-color: #f8fafc; padding: 30px; text-align: center; border-radius: 8px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2563eb;">${resetCode}</span>
      </div>
      <div style="margin-top: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p>If you did not request this, please ignore this email.</p>
        <p>&copy; ${new Date().getFullYear()} Whats Happening Australia. All rights reserved.</p>
      </div>
    </div>
  `;

  const mailSent = await sendSimpleMail(
    email,
    "Your Password Reset Code",
    `Your reset code is: ${resetCode}`,
    emailHtml,
  );
  if (!mailSent.success) {
    return { ok: false, status: 500, message: "Failed to send email" };
  }

  return { ok: true, message: "Reset code sent to email" };
}

export async function verifyResetCode(rawEmail: string, code: string): Promise<Result> {
  await connectToDb();
  const normalizedEmail = rawEmail?.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (!existingUser) return { ok: false, status: 404, message: "User not found" };

  const user = await User.findOne({
    email: normalizedEmail,
    resetPasswordToken: code,
    resetPasswordExpire: { $gt: new Date() },
  });
  if (!user) {
    const isExpired =
      existingUser.resetPasswordExpire &&
      existingUser.resetPasswordExpire < new Date();
    return {
      ok: false,
      status: 400,
      message: isExpired ? "Code has expired" : "Invalid verification code",
    };
  }

  return { ok: true, message: "Code verified successfully" };
}

export async function setNewPassword(
  rawEmail: string,
  code: string,
  password: string,
): Promise<Result> {
  await connectToDb();
  // Now trimmed + lowercased to match sendResetCode/verifyResetCode and how
  // signup/login store and look up email — previously this one function didn't
  // normalize at all, a real inconsistency now fixed rather than preserved.
  const email = rawEmail?.trim().toLowerCase();
  if (!password || password.length < 6) {
    return {
      ok: false,
      status: 400,
      message: "Password must be at least 6 characters",
    };
  }

  const user = await User.findOne({
    email,
    resetPasswordToken: code,
    resetPasswordExpire: { $gt: Date.now() },
  });
  if (!user) return { ok: false, status: 400, message: "Unauthorized request" };

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return { ok: true, message: "Password updated successfully" };
}
