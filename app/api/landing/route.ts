import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { Deal } from "@/server/models/DealSchema.model";
import Event from "@/server/models/Event.model";
import { NextRequest, NextResponse } from "next/server";

function escapeRegex(text: string) {
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    await connectToDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const { searchParams } = new URL(request.url);
    const cityParam = searchParams.get("city") || "";
    const query: any = { category: "business" };

    const city = cityParam.replace(/\?+$/, "").trim();

    if (city) {
      const safeCity = escapeRegex(city);
      query.name = { $regex: safeCity, $options: "i" };
    }

    const business = await User.find({ category: "business", ...query }).sort({
      createdAt: -1,
    });
    const upcomingevents = await Event.find({
      "dateRange.from": { $gte: todayISO },
    })
      .populate("user")
      .sort({ "dateRange.from": 1 })
      .limit(10)
      .lean();

    const deals = await Deal.find({ valid_till: { $gte: todayISO } })
      .populate("user")
      .sort({ valid_till: 1 })
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
