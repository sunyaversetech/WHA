import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { Review } from "@/server/models/Review.model";
import { Service } from "@/server/models/Service.model";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import "@/server/models/Service.model";
import { resolveCityCoords } from "@/components/ResuableComponents/LocationSearch/city-coords";
import { buildDistancePipeline } from "@/server/lib/geo-search";

function escapeRegex(text: string) {
  return text.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

const AU_CITY_NAMES = [
  "sydney",
  "melbourne",
  "brisbane",
  "perth",
  "adelaide",
  "canberra",
  "hobart",
  "darwin",
  "goldcoast",
  "gold coast",
  "newcastle",
  "wollongong",
  "geelong",
  "townsville",
  "cairns",
];
const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "for",
  "to",
  "at",
  "of",
  "in",
  "on",
  "is",
  "are",
  "me",
  "my",
  "i",
  "near",
  "around",
  "close",
  "by",
  "area",
  "local",
  "best",
  "top",
  "good",
]);

function extractKeywords(raw: string): string[] {
  let q = raw
    .replace(/\bnear\s+me\b/gi, " ")
    .replace(/\bin\s+my\s+area\b/gi, " ")
    .replace(/\baround\s+me\b/gi, " ")
    .replace(/\bclose\s+to\s+me\b/gi, " ")
    .replace(/\bnearby\b/gi, " ")
    .replace(/\bnear\s+\w+/gi, " ")
    .replace(/\bin\s+\w+/gi, " ")
    .replace(/\baround\s+\w+/gi, " ")
    .replace(/\bclose\s+to\s+\w+/gi, " ")
    .replace(/\b(australia|au)\b/gi, " ");

  for (const city of AU_CITY_NAMES) {
    q = q.replace(new RegExp(`\\b${escapeRegex(city)}\\b`, "gi"), " ");
  }

  return q
    .split(/\s+/)
    .map((t) => t.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

const RESULT_LIMIT = 200;

export async function GET(request: NextRequest) {
  try {
    await connectToDb();

    const { searchParams } = new URL(request.url);
    const rawCategory = searchParams.get("category") || "";
    const rawSearch = searchParams.get("search") || "";
    const rawService = searchParams.get("service") || "";
    const rawCity = searchParams.get("city") || "";
    const rawCommunity = searchParams.get("community") || "";
    const rawLat = searchParams.get("lat");
    const rawLng = searchParams.get("lng");
    const rawRadius = searchParams.get("radius");

    // Map viewport bounds (sent when user pans/zooms the map)
    const rawSwLat = searchParams.get("swLat");
    const rawSwLng = searchParams.get("swLng");
    const rawNeLat = searchParams.get("neLat");
    const rawNeLng = searchParams.get("neLng");

    const search = rawSearch.replace(/\?+$/, "").trim();
    const service = rawService.replace(/\?+$/, "").trim();
    const category = rawCategory.replace(/\?+$/, "").trim();
    const city = rawCity.replace(/\?+$/, "").trim();
    const community = rawCommunity.replace(/\?+$/, "").trim();

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

    // ── Base filter ──────────────────────────────────────────────────────────
    const baseFilter: any = { category: "business" };

    if (category && category !== "all") {
      baseFilter.business_category = category;
    }

    // Independent $or-clauses accumulate here and get AND-ed together at the
    // end, so the free-text "search" box and the "service" picker can both
    // be active at once without one clobbering the other's $or.
    const andClauses: any[] = [];

    if (search) {
      const safe = escapeRegex(search);
      andClauses.push({
        $or: [
          { business_name: { $regex: safe, $options: "i" } },
          { seo_keywords: { $regex: safe, $options: "i" } },
          { seo_description: { $regex: safe, $options: "i" } },
        ],
      });
    }

    if (community) {
      baseFilter.community = {
        $regex: `^${escapeRegex(community)}$`,
        $options: "i",
      };
    }

    // ── Category / service filter ────────────────────────────────────────────
    // The search bar sends the selected category label (e.g. "Automotive").
    // Map it to the stored business_category value and filter directly.
    // Falls back to a Service-model keyword search for anything unrecognised.
    const CATEGORY_MAP: Record<string, string> = {
      automotive: "automotive",
      cleaning: "cleaning",
      electrician: "electrician",
      restaurant: "restaurant",
      consultancy: "consultancy",
      travel: "travel and tours",
      "travel and tours": "travel and tours",
      wedding: "wedding",
      painter: "painter",
      grocery: "grocery",
      "event organizer": "event-organizer",
      "event-organizer": "event-organizer",
      removalists: "removalists",
      "saloon / barber": "barber",
      barber: "barber",
      plumber: "plumber",
      "driving school": "driving school",
      "food truck": "food truck",
      catering: "catering",
      "health & wellness": "health",
      health: "health",
      "retail shop": "retails",
      retails: "retails",
      "social club": "social club",
      others: "others",
    };

    if (service) {
      const catValue = CATEGORY_MAP[service.toLowerCase().trim()];
      if (catValue) {
        // Direct category match — filter by business_category field
        baseFilter.business_category = catValue;
      } else {
        // Free-text match: business name, SEO keywords/description, and
        // service name/category/description all count as a hit.
        const keywords = extractKeywords(service);
        const terms = keywords.length > 0 ? keywords : [service.trim()];

        const serviceOrClauses = terms.flatMap((tok) => {
          const safe = escapeRegex(tok);
          return [
            { name: { $regex: safe, $options: "i" } },
            { category: { $regex: safe, $options: "i" } },
            { description: { $regex: safe, $options: "i" } },
          ];
        });

        const matchingServices = await Service.find({
          $or: serviceOrClauses,
        }).lean();
        const uniqueIds = [
          ...new Set(
            matchingServices
              .map((s: any) => s.business_id?.toString())
              .filter(Boolean),
          ),
        ] as string[];

        const objectIds = uniqueIds
          .map((id) => {
            try {
              return new mongoose.Types.ObjectId(id);
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        const safe = escapeRegex(service.trim());
        andClauses.push({
          $or: [
            { business_name: { $regex: safe, $options: "i" } },
            { seo_keywords: { $regex: safe, $options: "i" } },
            { seo_description: { $regex: safe, $options: "i" } },
            ...(objectIds.length > 0 ? [{ _id: { $in: objectIds } }] : []),
          ],
        });
      }
    }

    if (andClauses.length > 0) {
      baseFilter.$and = andClauses;
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
      // excluded businesses that are genuinely in the area. Resolve the
      // city's known centroid and run the same distance-based search used
      // for GPS/"Current location". If the city isn't in our known
      // coordinate table, no spatial constraint is applied at all — better
      // to fall through to an unfiltered-by-location result than to
      // reintroduce a strict, easily-wrong text match.
      const cityCoords = resolveCityCoords(city);
      if (cityCoords) {
        useGeo = true;
        geoLat = cityCoords[0];
        geoLng = cityCoords[1];
        geoRadiusKm = geoRadiusKm ?? 50; // metro-area scope
      }
    }

    // ── Execute query ────────────────────────────────────────────────────────
    let businesses: any[];

    if (useGeo) {
      // GPS-, city-, or map-area-based: sort by distance, optional radius
      // cap. Computed from latitude/longitude directly (see
      // buildDistancePipeline) rather than $geoNear, so businesses missing
      // the `geo` GeoJSON field still show up. A genuinely empty result
      // (nothing within range) is left empty — falling back to an
      // unsorted, unfiltered-by-distance query would defeat the point of a
      // distance-based search.
      try {
        businesses = await User.aggregate(
          buildDistancePipeline(
            geoLat!,
            geoLng!,
            baseFilter,
            geoRadiusKm,
            RESULT_LIMIT,
          ),
        );
      } catch {
        // Aggregation itself failed (e.g. transient DB error) — degrade to
        // an unsorted query rather than a hard failure.
        businesses = await User.find(baseFilter)
          .sort({ createdAt: -1 })
          .limit(RESULT_LIMIT)
          .lean();
      }
    } else {
      // City/text filter only, no resolvable coordinates
      businesses = await User.find(baseFilter)
        .sort({ createdAt: -1 })
        .limit(RESULT_LIMIT)
        .lean();
    }

    // ── Batch-fetch reviews + services ───────────────────────────────────────
    const businessSlugs = businesses.map((b: any) =>
      b.business_name?.toLowerCase().replace(/[^a-z0-9]/g, ""),
    );
    const businessHexIds = businesses.map((b: any) => b._id.toString());

    const [reviews, services] = await Promise.all([
      Review.find({ business_id: { $in: businessSlugs } }).lean(),
      Service.find({ business_id: { $in: businessHexIds } }).lean(),
    ]);

    const reviewsBySlug = new Map<string, typeof reviews>();
    for (const review of reviews) {
      const slug = review.business_id as string;
      if (!reviewsBySlug.has(slug)) reviewsBySlug.set(slug, []);
      reviewsBySlug.get(slug)!.push(review);
    }

    const servicesByBusinessId = new Map<string, typeof services>();
    for (const svc of services) {
      const id = svc.business_id.toString();
      if (!servicesByBusinessId.has(id)) servicesByBusinessId.set(id, []);
      servicesByBusinessId.get(id)!.push(svc);
    }

    const businessesWithReviews = businesses.map((business: any) => {
      const slug = business.business_name
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "");
      const id = business._id.toString();
      return {
        ...business,
        reviews: reviewsBySlug.get(slug) ?? [],
        services: servicesByBusinessId.get(id) ?? [],
      };
    });

    return NextResponse.json(
      {
        data: businessesWithReviews,
        message: "Businesses retrieved successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
