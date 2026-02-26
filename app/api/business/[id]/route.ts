import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { NextRequest, NextResponse } from "next/server";

type Props = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, { params }: Props) {
  try {
    await connectToDb();
    const { id } = await params;

    const business = await User.findById(id, {
      select: { business_name: 1, image: 1 },
    }).sort({ createdAt: -1 });
    return NextResponse.json(
      { data: business, message: "Businesses retrieved successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
