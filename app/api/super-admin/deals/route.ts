import { connectToDb } from "@/lib/db";
import { Deal } from "@/server/models/DealSchema.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDb();
    const deals = await Deal.find().populate("user").sort({
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
