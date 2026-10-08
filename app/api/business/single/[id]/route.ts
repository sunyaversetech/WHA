import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { Deal } from "@/server/models/DealSchema.model";
import { Employee } from "@/server/models/Employee.model";
import Event from "@/server/models/Event.model";
import { OperatingHours } from "@/server/models/OperatingHour.model";
import { Review } from "@/server/models/Review.model";
import { Service } from "@/server/models/Service.model";
import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_BUSINESS_FIELDS } from "@/server/lib/publicUserFields";
import { slugOrIdFilter } from "@/server/lib/slug";

type Props = { params: Promise<{ id: string }> };
export async function GET(req: NextRequest, { params }: Props) {
  try {
    await connectToDb();
    const { id } = await params;

    // Preferred path: the persisted slug (indexed) or a raw ObjectId.
    let business = await User.findOne(
      { category: "business", ...slugOrIdFilter(id) },
      PUBLIC_BUSINESS_FIELDS,
    )
      .sort({ createdAt: -1 })
      .lean();

    // Safety net for any business somehow missing a slug (pre-backfill, or a
    // gap in it) — falls back to the original fuzzy name match.
    if (!business) {
      const searchRegex = id.split("").join("\\s*");
      business = await User.findOne(
        {
          business_name: {
            $regex: `^${searchRegex}$`,
            $options: "i",
          },
        },
        PUBLIC_BUSINESS_FIELDS,
      )
        .sort({ createdAt: -1 })
        .lean();
    }

    const event = await Event.find({
      user: business._id,
      "dateRange.to": { $gt: new Date().toISOString() },
    })
      .sort({ createdAt: -1 })
      .select(
        "-description -event_rules -refund_policy -support_details -promo_codes -options",
      );
    const deal = await Deal.find({
      user: business._id,
      "dateRange.to": { $gt: new Date().toISOString() },
    })
      .populate("user", "business_name location city image")
      .sort({
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

    const services = await Service.find({
      business_id: business._id,
    })
      .populate("assigned_employees business_id")
      .sort({ createdAt: -1 })
      .lean();
    const employees = await Employee.find({ business_id: business._id });

    const hours = await OperatingHours.findOne({ business_id: business._id });

    return NextResponse.json(
      {
        data: {
          ...business,
          review: review,
          hours: hours,
          event: event,
          deal: deal,
          services: services,
          employees: employees,
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
