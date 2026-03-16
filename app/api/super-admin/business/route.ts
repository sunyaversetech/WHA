import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDb();
    const deals = await User.find({ category: "business" })
      .populate("user")
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
