import { connectToDb } from "@/lib/db";
import EmailVerification from "@/server/models/EmailVerification.model";
import { NextRequest, NextResponse } from "next/server";

const MAX_ATTEMPTS = 5;
const VERIFIED_TTL_MS = 30 * 60 * 1000; // give the user time to finish signing up

export async function POST(req: NextRequest) {
  try {
    await connectToDb();

    const { email: rawEmail, code } = await req.json();
    const email = (rawEmail as string)?.trim().toLowerCase();

    if (!email || !code) {
      return NextResponse.json(
        { message: "Email and code are required" },
        { status: 400 },
      );
    }

    const record = await EmailVerification.findOne({ email });
    if (!record) {
      return NextResponse.json(
        { message: "No verification in progress for this email. Please request a new code." },
        { status: 400 },
      );
    }

    if (record.expires_at < new Date()) {
      return NextResponse.json(
        { message: "This code has expired. Please request a new one." },
        { status: 400 },
      );
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { message: "Too many incorrect attempts. Please request a new code." },
        { status: 400 },
      );
    }

    if (record.code !== String(code).trim()) {
      record.attempts += 1;
      await record.save();
      return NextResponse.json(
        { message: "Incorrect code. Please try again." },
        { status: 400 },
      );
    }

    record.verified = true;
    record.expires_at = new Date(Date.now() + VERIFIED_TTL_MS);
    await record.save();

    return NextResponse.json({ message: "Email verified", success: true });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
