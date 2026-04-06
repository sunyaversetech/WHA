import { connectToDb } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/mail";
import User from "@/server/models/Auth.model";
import crypto from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    await connectToDb();

    const tokenToUse = crypto.randomBytes(32).toString("hex");
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24);

    const user = await User.findOneAndUpdate(
      { email },
      { token: tokenToUse, verificationTokenExpire: expiryDate },
      { upsert: true },
    );

    await sendVerificationEmail(email, tokenToUse);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verification email error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to send verification email." },
      { status: 500 },
    );
  }
}
