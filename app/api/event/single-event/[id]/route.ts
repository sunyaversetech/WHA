import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";
import { Review } from "@/server/models/Review.model";
import { releaseExpiredHolds } from "@/server/lib/ticketHold";
import { NextRequest, NextResponse } from "next/server";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  try {
    await connectToDb();

    const { id } = await params;

    // Reconcile any expired ticket holds for this event before computing
    // remaining availability, so the public page never shows stale counts.
    const eventRef = await Event.findOne({ slug: id }).select("_id");
    if (eventRef) {
      await releaseExpiredHolds(eventRef._id.toString());
    }

    const event = await Event.findOne({ slug: id })
      .select("-options.promo_code -promo_codes")
      .populate("user", "email business_name city location image")
      .lean();

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    const review = await Review.find({ business_id: event._id })
      .sort({
        createdAt: -1,
      })
      .lean();
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Event fetched successfully",
      data: { ...event, reviews: review },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
