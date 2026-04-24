import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";
import { NextRequest, NextResponse } from "next/server";

// Helper to escape special regex characters
function escapeRegex(text: string) {
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    await connectToDb();

    const { searchParams } = new URL(request.url);

    const rawCategory = searchParams.get("category") || "";
    const rawSearch = searchParams.get("search") || "";
    const rawCity = searchParams.get("city") || "";
    const rawCommunity = searchParams.get("community") || "";
    const rawFrom = searchParams.get("from") || "";
    const rawTo = searchParams.get("to") || "";

    const category = rawCategory.replace(/\?+$/, "").trim();
    const search = rawSearch.replace(/\?+$/, "").trim();
    const city = rawCity.replace(/\?+$/, "").trim();
    const community = rawCommunity.replace(/\?+$/, "").trim();
    const from = rawFrom.replace(/\?+$/, "").trim();
    const to = rawTo.replace(/\?+$/, "").trim();

    const query: any = {};

    // 1. Establish the "Today" threshold
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dateQuery: any = {};

    if (from) {
      const searchFrom = new Date(from);
      searchFrom.setHours(0, 0, 0, 0);
      dateQuery["dateRange.from"] = { $gte: searchFrom };
    } else {
      dateQuery["dateRange.from"] = { $gte: today };
    }

    if (to) {
      const searchTo = new Date(to);
      searchTo.setHours(23, 59, 59, 999);
      dateQuery["dateRange.from"] = {
        ...dateQuery["dateRange.from"],
        $lte: searchTo,
      };
    }

    Object.assign(query, dateQuery);

    if (search) {
      const safeSearch = escapeRegex(search);
      query.title = { $regex: safeSearch, $options: "i" };
    }

    if (city && city !== "all") {
      query.city = { $regex: `^${escapeRegex(city)}$`, $options: "i" };
    }
    if (community) {
      query.community = {
        $regex: `^${escapeRegex(community)}$`,
        $options: "i",
      };
    }

    const myEvents = await Event.find(query).sort({ createdAt: -1 });

    return NextResponse.json(
      { data: myEvents, message: "Events retrieved successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
