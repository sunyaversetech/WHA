import { NextResponse } from "next/server";
import { setNewPassword } from "@/server/lib/passwordReset";

export async function POST(req: Request) {
  const { email, code, password } = await req.json();
  const result = await setNewPassword(email, code, password);

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }
  return NextResponse.json({ message: result.message });
}
