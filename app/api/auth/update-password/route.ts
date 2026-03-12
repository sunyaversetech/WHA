import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";

export async function POST(req: Request) {
  await connectToDb();
  const { email, code, password } = await req.json();

  const user = await User.findOne({
    email,
    resetPasswordToken: code,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized request" },
      { status: 400 },
    );
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);

  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  return NextResponse.json({ message: "Password updated successfully" });
}
