import { NextResponse } from "next/server";
import { sendSimpleMail } from "@/lib/mail";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, subject, message } = body;

    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields: email, subject, or message." },
        { status: 400 },
      );
    }

    const result = await sendSimpleMail(email, subject, message);

    if (result.success) {
      return NextResponse.json(
        { message: "Email sent successfully!" },
        { status: 200 },
      );
    } else {
      return NextResponse.json(
        { error: "Mailtrap failed to deliver the message." },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("API_SEND_EMAIL_ERROR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
