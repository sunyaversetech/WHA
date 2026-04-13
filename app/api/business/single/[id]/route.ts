import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { Deal } from "@/server/models/DealSchema.model";
import Event from "@/server/models/Event.model";
import { OperatingHours } from "@/server/models/OperatingHour.model";
import { Review } from "@/server/models/Review.model";
import { NextRequest, NextResponse } from "next/server";

type Props = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, { params }: Props) {
  try {
    await connectToDb();
    const { id } = await params;
    const searchRegex = id.split("").join("\\s*");
    const business = await User.findOne(
      {
        business_name: {
          $regex: `^${searchRegex}$`,
          $options: "i",
        },
      },
      "-accpetalltermsandcondition -password -provider -googleId",
    )
      .sort({ createdAt: -1 })
      .lean();

    const event = await Event.find({ user: business._id }).sort({
      createdAt: -1,
    });
    const deal = await Deal.find({ user: business._id }).sort({
      createdAt: -1,
    });

    if (!business) {
      return NextResponse.json(
        { error: "Business not found" },
        { status: 404 },
      );
    }

    const review = await Review.find({ business_id: business._id }).sort({
      createdAt: -1,
    });

    const hours = await OperatingHours.findOne({ business_id: business._id });

    return NextResponse.json(
      {
        data: {
          ...business,
          review: review,
          hours: hours,
          event: event,
          deal: deal,
        },
        message: "Businesses retrieved successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

//  owner: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       unique: true,
//     },
//     business_name: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     business_category: {
//       type: String,
//       required: true,
//     },
//     service_category: {
//       type: String,
//       required: true,
//     },
//     business_service: [ServiceSchema],
//     location: {
//       address: { type: String, required: true },
//       city: { type: String },
//       coordinates: {
//         lat: Number,
//         lng: Number,
//       },
//     },
