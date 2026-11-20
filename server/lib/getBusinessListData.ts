import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { Review } from "@/server/models/Review.model";
import { Service } from "@/server/models/Service.model";
import mongoose from "mongoose";
import "@/server/models/Service.model";
import { resolveCityCoords } from "@/components/ResuableComponents/LocationSearch/city-coords";
import { buildDistancePipeline } from "@/server/lib/geo-search";
import { PUBLIC_BUSINESS_FIELD_LIST } from "@/server/lib/publicUserFields";
import {
  normalizeBusinessParams,
  type BusinessQueryParams,
} from "@/lib/queries/business-query";

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

// Extracted from app/api/business/route.tsx (which now just parses the
// request URL and delegates here) so the same DB query can also be called
// directly from app/page.tsx and app/search/page.tsx for server-side
// prefetch, without an HTTP round-trip to our own API route.
export async function getBusinessListData(rawParams: BusinessQueryParams) {
  await connectToDb();

  const normalized = normalizeBusinessParams(rawParams);
  // Preserved from the original route: defensive trim/strip of a stray
  // trailing "?" on every text param, done server-side only (the client
  // hook never did this - it's not a cache-key concern).
  const strip = (v: string) => v.replace(/\?+$/, "").trim();
  const search = strip(normalized.search);
  const service = strip(normalized.service);
  const category = strip(normalized.category);
  const city = strip(normalized.city);
  const community = strip(normalized.community);

  const rawLat = normalized.lat || null;
  const rawLng = normalized.lng || null;
  const rawRadius = normalized.radius || null;
  const rawSwLat = normalized.swLat || null;
  const rawSwLng = normalized.swLng || null;
  const rawNeLat = normalized.neLat || null;
  const rawNeLng = normalized.neLng || null;

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

  const baseFilter: any = { category: "business" };

  if (category && category !== "all") {
    baseFilter.business_category = category;
  }

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
      baseFilter.business_category = catValue;
    } else {
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

  let businesses: any[];

  if (useGeo) {
    try {
      const projection: Record<string, 1> = { distance: 1 };
      for (const field of PUBLIC_BUSINESS_FIELD_LIST) projection[field] = 1;
      businesses = await User.aggregate([
        ...buildDistancePipeline(
          geoLat!,
          geoLng!,
          baseFilter,
          geoRadiusKm,
          RESULT_LIMIT,
        ),
        { $project: projection },
      ]);
    } catch {
      businesses = await User.find(baseFilter)
        .select(PUBLIC_BUSINESS_FIELD_LIST.join(" "))
        .sort({ createdAt: -1 })
        .limit(RESULT_LIMIT)
        .lean();
    }
  } else {
    businesses = await User.find(baseFilter)
      .select(PUBLIC_BUSINESS_FIELD_LIST.join(" "))
      .sort({ createdAt: -1 })
      .limit(RESULT_LIMIT)
      .lean();
  }

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
    const slug = business.business_name?.toLowerCase().replace(/[^a-z0-9]/g, "");
    const id = business._id.toString();
    return {
      ...business,
      reviews: reviewsBySlug.get(slug) ?? [],
      services: servicesByBusinessId.get(id) ?? [],
    };
  });

  return {
    data: businessesWithReviews,
    message: "Businesses retrieved successfully",
  };
}
