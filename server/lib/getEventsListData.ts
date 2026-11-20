import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";
import { resolveCityCoords } from "@/components/ResuableComponents/LocationSearch/city-coords";
import { buildDistancePipeline } from "@/server/lib/geo-search";
import {
  normalizeEventsParams,
  type EventsQueryParams,
} from "@/lib/queries/events-query";

function escapeRegex(text: string) {
  return text.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

const RESULT_LIMIT = 200;

// Extracted from app/api/event/getallevent/route.ts (which now just parses
// the request URL and delegates here) so the same DB query can also be
// called directly from app/events/page.tsx for server-side prefetch,
// without an HTTP round-trip to our own API route.
//
// bounds is kept separate from EventsQueryParams (the cache-key-relevant
// subset) because useGetAllEvents never reads/sends swLat/swLng/neLat/neLng
// today - but the route accepted them before this refactor, so that's
// preserved here for any other caller relying on it.
export async function getEventsListData(
  rawParams: EventsQueryParams,
  bounds?: {
    swLat?: string | null;
    swLng?: string | null;
    neLat?: string | null;
    neLng?: string | null;
  },
) {
  await connectToDb();

  const normalized = normalizeEventsParams(rawParams);
  // The original route stripped trailing "?" and whitespace from every
  // text param before use (defensive against a malformed query string) -
  // preserved here exactly, even though the client hook itself never did
  // this (it's a server-side-only safety net, not a cache-key concern).
  const strip = (v: string) => v.replace(/\?+$/, "").trim();
  const category = strip(normalized.category);
  const search = strip(normalized.search);
  const city = strip(normalized.city);
  const community = strip(normalized.community);
  const from = strip(normalized.from);
  const { lat, lng, radius } = normalized;
  const rawSwLat = bounds?.swLat || null;
  const rawSwLng = bounds?.swLng || null;
  const rawNeLat = bounds?.neLat || null;
  const rawNeLng = bounds?.neLng || null;
  const hasBounds = !!(rawSwLat && rawSwLng && rawNeLat && rawNeLng);

  const latNum = lat !== "" ? parseFloat(lat) : null;
  const lngNum = lng !== "" ? parseFloat(lng) : null;
  let useGeo =
    latNum !== null &&
    lngNum !== null &&
    !isNaN(latNum) &&
    !isNaN(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180;
  let geoLat = latNum;
  let geoLng = lngNum;
  let geoRadiusKm = radius ? Math.max(1, parseFloat(radius)) : null;

  const today = new Date().toISOString().split("T")[0];

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

  if (hasBounds) {
    const swLatF = parseFloat(rawSwLat!);
    const swLngF = parseFloat(rawSwLng!);
    const neLatF = parseFloat(rawNeLat!);
    const neLngF = parseFloat(rawNeLng!);
    useGeo = true;
    geoLat = (swLatF + neLatF) / 2;
    geoLng = (swLngF + neLngF) / 2;
  } else if (city && city !== "all" && !useGeo) {
    const cityCoords = resolveCityCoords(city);
    if (cityCoords) {
      useGeo = true;
      geoLat = cityCoords[0];
      geoLng = cityCoords[1];
      geoRadiusKm = geoRadiusKm ?? 50;
    }
  }

  let events: any[];

  if (useGeo) {
    try {
      events = await Event.aggregate([
        ...buildDistancePipeline(
          geoLat!,
          geoLng!,
          baseFilter,
          geoRadiusKm,
          RESULT_LIMIT,
        ),
        { $unset: "promo_codes" },
      ]);
    } catch {
      events = await Event.find(baseFilter)
        .select("-promo_codes")
        .sort({ "dateRange.from": 1 })
        .limit(RESULT_LIMIT)
        .lean();
    }
  } else {
    events = await Event.find(baseFilter)
      .select("-promo_codes")
      .sort({ "dateRange.from": 1 })
      .limit(RESULT_LIMIT)
      .lean();
  }

  return { data: events, message: "Events retrieved successfully" };
}
