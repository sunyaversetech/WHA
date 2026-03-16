import { NextResponse } from "next/server";
import { sendSimpleMail } from "@/lib/mail";
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";

export async function POST(req: Request) {
  try {
    await connectToDb();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        $set: {
          resetPasswordToken: resetCode,
          resetPasswordExpire: resetPasswordExpire,
        },
      },
      { new: true, runValidators: false },
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
          <p>&copy; ${new Date().getFullYear()} Sunyaverse. All rights reserved.</p>
        </div>
      </div>
    `;

    // 5. Send the email
    const mailSent = await sendSimpleMail(
      email,
      "Your Password Reset Code - Sunyaverse",
      `Your reset code is: ${resetCode}`,
      emailHtml,
    );

    if (!mailSent.success) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Reset code sent to email" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
