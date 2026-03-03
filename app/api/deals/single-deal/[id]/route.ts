import { connectToDb } from "@/lib/db";
import { Deal } from "@/server/models/DealSchema.model";
import { NextRequest, NextResponse } from "next/server";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  try {
    await connectToDb();

    const { id } = await params;

    const deal = await Deal.findById(id).populate("user");
    if (!deal) {
      return NextResponse.json({ message: "deal not found" }, { status: 404 });
    }
    return NextResponse.json({
      message: "deal fetched successfully",
      data: deal,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
