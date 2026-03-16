import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDb();
    const event = await Event.find().populate("user").sort({
      createdAt: -1,
    });
    return NextResponse.json({
      message: "Event Fetched Scuccessfully",
      data: event,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
