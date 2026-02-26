import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { Deal } from "@/server/models/DealSchema.model";
import Event from "@/server/models/Event.model";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const business = await User.find({ category: "business" }).sort({
      createdAt: -1,
    });

    const upcomingevents = await Event.find({
      events: "event",
      date: { $gte: today },
    })
      .sort({ date: 1 })
      .limit(10);

    const deals = await Deal.find({
      events: "deal",
      date: { $gte: today },
    })
      .sort({ date: 1 })
      .limit(10);

    return NextResponse.json(
      {
        data: { upcomingevents, deals, business },
        message: "Businesses retrieved successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
