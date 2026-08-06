import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import EmailVerification from "@/server/models/EmailVerification.model";
import { sendSignupVerificationCode } from "@/lib/mail";
import { NextRequest, NextResponse } from "next/server";

const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function POST(req: NextRequest) {
  try {
    await connectToDb();

    const { email: rawEmail } = await req.json();
    const email = (rawEmail as string)?.trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    const existingAccount = await User.findOne({ email });
    if (existingAccount) {
      return NextResponse.json(
        { message: "An account with this email already exists" },
        { status: 400 },
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await EmailVerification.findOneAndUpdate(
      { email },
      {
        email,
        code,
        verified: false,
        attempts: 0,
        expires_at: new Date(Date.now() + CODE_TTL_MS),
      },
      { upsert: true },
    );

    await sendSignupVerificationCode(email, code);

    return NextResponse.json({
      message: "Verification code sent",
      success: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
