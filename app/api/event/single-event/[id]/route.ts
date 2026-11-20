import { connectToDb } from "@/lib/db";
import { getSingleEventData } from "@/server/lib/getSingleEventData";
import { NextRequest, NextResponse } from "next/server";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  try {
    await connectToDb();

    const { id } = await params;
    const event = await getSingleEventData(id);

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Event fetched successfully",
      data: event,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
