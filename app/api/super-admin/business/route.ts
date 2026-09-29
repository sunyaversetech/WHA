import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.category !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDb();
    const deals = await User.find({ category: "business" })
      .select("-password -token -resetPasswordToken -resetPasswordExpire -verificationTokenExpire")
      .sort({
        createdAt: -1,
      });
    return NextResponse.json({
      message: "Business Fetched Scuccessfully",
      data: deals,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
