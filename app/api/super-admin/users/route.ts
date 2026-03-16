import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { Deal } from "@/server/models/DealSchema.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDb();
    const users = await User.find({ category: "user" }).populate("user").sort({
      createdAt: -1,
    });
    return NextResponse.json({
      message: "User Fetched Scuccessfully",
      data: users,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
