import { NextResponse } from "next/server";
import { verifyResetCode } from "@/server/lib/passwordReset";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    const result = await verifyResetCode(email, code);

    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: result.status });
    }
    return NextResponse.json({ message: result.message }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
