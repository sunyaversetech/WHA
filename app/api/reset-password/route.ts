import { NextResponse } from "next/server";
import { sendResetCode } from "@/server/lib/passwordReset";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    const result = await sendResetCode(email);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }
    return NextResponse.json({ message: result.message }, { status: 200 });
  } catch (error: any) {
    console.error("Reset Password Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
