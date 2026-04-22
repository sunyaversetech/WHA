import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    await connectToDb();

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    const user = await User.findOne({ token: token });

    if (!user) {
      return NextResponse.json(
        { error: "Token is invalid or has expired." },
        { status: 400 },
      );
    }

    user.emailVerified = new Date();
    user.verified = true;

    user.token = undefined;
    user.verificationTokenExpire = undefined;

    await user.save();

    return NextResponse.json(
      { message: "Email verified successfully!" },
      { status: 200 },
    );
  } catch (error) {
    console.error("VERIFICATION_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
