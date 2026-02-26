import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDb();

    const business = await User.find({ category: "business" }).sort({
      createdAt: -1,
    });
    return NextResponse.json(
      { data: business, message: "Businesses retrieved successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
