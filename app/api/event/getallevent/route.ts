import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";
import { NextRequest, NextResponse } from "next/server";
import { resolveCityCoords } from "@/components/ResuableComponents/LocationSearch/city-coords";
import { buildDistancePipeline } from "@/server/lib/geo-search";

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

    // Map viewport bounds (sent when user pans/zooms the map)
    const rawSwLat = searchParams.get("swLat");
    const rawSwLng = searchParams.get("swLng");
    const rawNeLat = searchParams.get("neLat");
    const rawNeLng = searchParams.get("neLng");

    const category = rawCategory.replace(/\?+$/, "").trim();
    const search = rawSearch.replace(/\?+$/, "").trim();
    const city = rawCity.replace(/\?+$/, "").trim();
    const community = rawCommunity.replace(/\?+$/, "").trim();
    const from = rawFrom.replace(/\?+$/, "").trim();

    // Parse and validate coordinates
    const lat = rawLat !== null ? parseFloat(rawLat) : null;
    const lng = rawLng !== null ? parseFloat(rawLng) : null;
    let useGeo =
      lat !== null &&
      lng !== null &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180;
    let geoLat = lat;
    let geoLng = lng;
    let geoRadiusKm = rawRadius ? Math.max(1, parseFloat(rawRadius)) : null;

    const hasBounds = !!(rawSwLat && rawSwLng && rawNeLat && rawNeLng);

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
    if (community) {
      baseFilter.community = {
        $regex: `^${escapeRegex(community)}$`,
        $options: "i",
      };
    }

    // ── Spatial filter: map area (bounds) OR city — both resolve to a
    // reference point for a distance-sorted search, not a hard exclusion
    // filter. The list should keep showing the complete set of nearby
    // results sorted by distance even when the user has zoomed into a
    // small area — only the map's own rendering (drawing markers at their
    // real position) naturally clips to whatever's currently in view.
    // ───────────────────────────────────────────────────────────────────────
    if (hasBounds) {
      const swLatF = parseFloat(rawSwLat!);
      const swLngF = parseFloat(rawSwLng!);
      const neLatF = parseFloat(rawNeLat!);
      const neLngF = parseFloat(rawNeLng!);
      useGeo = true;
      geoLat = (swLatF + neLatF) / 2;
      geoLng = (swLngF + neLngF) / 2;
      // No radius cap here — the point is to keep surfacing nearby results
      // beyond the current viewport, not to exclude them.
    } else if (city && city !== "all" && !useGeo) {
      // A selected city is a map/distance reference point, not a database
      // filter — the stored `city` text field is sparse/inconsistent, so
      // matching against it (rather than real coordinates) silently
      // excluded events that are genuinely in the area. Resolve the city's
      // known centroid and run the same distance-based search used for
      // GPS/"Current location". If the city isn't in our known coordinate
      // table, no spatial constraint is applied at all — better to fall
      // through to an unfiltered-by-location result than to reintroduce a
      // strict, easily-wrong text match.
      const cityCoords = resolveCityCoords(city);
      if (cityCoords) {
        useGeo = true;
        geoLat = cityCoords[0];
        geoLng = cityCoords[1];
        geoRadiusKm = geoRadiusKm ?? 50; // metro-area scope
      }
    }

    let events: any[];

    if (useGeo) {
      // GPS-, city-, or map-area-based: sorted by distance ascending,
      // optional radius cap. Computed from latitude/longitude directly (see
      // buildDistancePipeline) rather than $geoNear, so events missing the
      // `geo` GeoJSON field still show up. A genuinely empty result
      // (nothing within range) is left empty — falling back to an
      // unsorted, unfiltered-by-distance query would defeat the point of a
      // distance-based search.
      try {
        events = await Event.aggregate([
          ...buildDistancePipeline(
            geoLat!,
            geoLng!,
            baseFilter,
            geoRadiusKm,
            RESULT_LIMIT,
          ),
          { $unset: "options.promo_code" },
        ]);
      } catch {
        // Aggregation itself failed (e.g. transient DB error) — degrade to
        // an unsorted query rather than a hard failure.
        events = await Event.find(baseFilter)
          .select("-options.promo_code")
          .sort({ "dateRange.from": 1 })
          .limit(RESULT_LIMIT)
          .lean();
      }
    } else {
      // City/text filter only, no resolvable coordinates
      events = await Event.find(baseFilter)
        .select("-options.promo_code")
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
