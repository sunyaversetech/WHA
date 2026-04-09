import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";
import { Review } from "@/server/models/Review.model";
import { NextRequest, NextResponse } from "next/server";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  try {
    await connectToDb();

    const { id } = await params;

    const searchRegex = id.split("").join("\\s*");
    const event = await Event.findOne({
      title: { $regex: `^${searchRegex}$`, $options: "i" },
    })
      .populate("user", "email business_name city location image")
      .lean();
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
