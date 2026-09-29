import { connectToDb } from "@/lib/db";
import { Deal } from "@/server/models/DealSchema.model";
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
    const deals = await Deal.find()
      .populate(
        "user",
        "-password -token -resetPasswordToken -resetPasswordExpire -verificationTokenExpire",
      )
      .sort({
        createdAt: -1,
      });
    return NextResponse.json({
      message: "Deal Fetched Scuccessfully",
      data: deals,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
