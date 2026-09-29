import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.category !== "super-admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, isblocked } = body;

  await connectToDb();
  const user = await User.findById(id).select(
    "-password -token -resetPasswordToken -resetPasswordExpire -verificationTokenExpire",
  );

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  await User.findOneAndUpdate({ _id: id }, { isblocked: isblocked });
  return NextResponse.json(user);
}
