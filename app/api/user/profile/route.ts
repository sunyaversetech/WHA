import { getServerSession } from "next-auth";
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDb();
  const user = await User.findOne({ email: session.user?.email });
  return NextResponse.json(user);
}
