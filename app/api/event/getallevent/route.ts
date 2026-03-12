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

    console.log("rawCommunity", rawCommunity);

    const category = rawCategory.replace(/\?+$/, "").trim();
    const search = rawSearch.replace(/\?+$/, "").trim();
    const city = rawCity.replace(/\?+$/, "").trim();
    const community = rawCommunity.replace(/\?+$/, "").trim();

    const query: any = {};

    if (category && category !== "all") {
      query.category = category;
    }

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
