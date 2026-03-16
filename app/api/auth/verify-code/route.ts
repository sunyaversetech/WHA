import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";

export async function POST(req: Request) {
  try {
    await connectToDb();
    const { email, code } = await req.json();

    // 1. Normalize email to lowercase to match Schema
    const normalizedEmail = email.toLowerCase();

    // 2. Debug: Find user by email ONLY first to see what's in the DB
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = await User.findOne({
      email: normalizedEmail,
      resetPasswordToken: code,
      resetPasswordExpire: { $gt: new Date() },
    });

    if (!user) {
      const isCodeWrong = existingUser.resetPasswordToken !== code;
      const isExpired =
        existingUser.resetPasswordExpire &&
        existingUser.resetPasswordExpire < new Date();

      return NextResponse.json(
        { error: isExpired ? "Code has expired" : "Invalid verification code" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "Code verified successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
