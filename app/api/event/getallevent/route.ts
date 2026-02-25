import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDb();
    const myEvents = await Event.find().sort({
      createdAt: -1,
    });

    return NextResponse.json(
      { data: myEvents, message: "All events retrieved" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
