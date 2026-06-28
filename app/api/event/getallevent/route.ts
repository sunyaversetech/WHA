import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";
import { NextRequest, NextResponse } from "next/server";

function escapeRegex(text: string) {
  return text.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

const RESULT_LIMIT = 200;

export async function GET(request: NextRequest) {
  try {
    await connectToDb();

    const { searchParams } = new URL(request.url);

    const rawCategory = searchParams.get("category") || "";
    const rawSearch = searchParams.get("search") || "";
    const rawCity = searchParams.get("city") || "";
    const rawCommunity = searchParams.get("community") || "";
    const rawFrom = searchParams.get("from") || "";
    const rawLat = searchParams.get("lat");
    const rawLng = searchParams.get("lng");
    const rawRadius = searchParams.get("radius");

    const category = rawCategory.replace(/\?+$/, "").trim();
    const search = rawSearch.replace(/\?+$/, "").trim();
    const city = rawCity.replace(/\?+$/, "").trim();
    const community = rawCommunity.replace(/\?+$/, "").trim();
    const from = rawFrom.replace(/\?+$/, "").trim();

    // Parse and validate coordinates
    const lat = rawLat !== null ? parseFloat(rawLat) : null;
    const lng = rawLng !== null ? parseFloat(rawLng) : null;
    const useGeo =
      lat !== null &&
      lng !== null &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;

    const today = new Date().toISOString().split("T")[0];

    // Base filter — always include upcoming-event date gate
    const baseFilter: any = {
      "dateRange.from": { $gte: from || today },
    };

    if (category && category !== "all") {
      baseFilter.category = category;
    }
    if (search) {
      const safeSearch = escapeRegex(search);
      baseFilter.title = { $regex: safeSearch, $options: "i" };
    }
    if (city && city !== "all") {
      baseFilter.city = { $regex: `^${escapeRegex(city)}$`, $options: "i" };
    }
    if (community) {
      baseFilter.community = {
        $regex: `^${escapeRegex(community)}$`,
        $options: "i",
      };
    }

    let events: any[];

    if (useGeo) {
      // Geospatial path — sorted by distance ascending, no radius cap unless
      // the user explicitly chose one from the filter modal.
      const geoNearStage: any = {
        near: { type: "Point", coordinates: [lng!, lat!] },
        distanceField: "distance",
        query: baseFilter,
        spherical: true,
      };
      if (rawRadius) {
        geoNearStage.maxDistance = Math.max(1, parseFloat(rawRadius)) * 1000;
      }
      try {
        events = await Event.aggregate([
          { $geoNear: geoNearStage },
          { $limit: RESULT_LIMIT },
        ]);
      } catch {
        events = [];
      }
      // Fall back to regular query if geo returns nothing (e.g. documents
      // haven't been migrated to have the geo field yet).
      if (events.length === 0) {
        events = await Event.find(baseFilter)
          .sort({ "dateRange.from": 1 })
          .limit(RESULT_LIMIT)
          .lean();
      }
    } else {
      // Fallback — date / text / city filter (original behaviour)
      events = await Event.find(baseFilter)
        .sort({ "dateRange.from": 1 })
        .limit(RESULT_LIMIT)
        .lean();
    }

    return NextResponse.json(
      { data: events, message: "Events retrieved successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
