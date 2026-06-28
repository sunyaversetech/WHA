import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { Review } from "@/server/models/Review.model";
import { Service } from "@/server/models/Service.model";
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
    const rawLat = searchParams.get("lat");
    const rawLng = searchParams.get("lng");
    const rawRadius = searchParams.get("radius");

    const search = rawSearch.replace(/\?+$/, "").trim();
    const category = rawCategory.replace(/\?+$/, "").trim();
    const city = rawCity.replace(/\?+$/, "").trim();
    const community = rawCommunity.replace(/\?+$/, "").trim();

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

    // Base filter shared by both the geo and city paths
    const baseFilter: any = { category: "business" };

    if (category && category !== "all") {
      baseFilter.business_category = category;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      baseFilter.business_name = { $regex: safeSearch, $options: "i" };
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

    let businesses: any[];

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
        businesses = await User.aggregate([
          { $geoNear: geoNearStage },
          { $limit: RESULT_LIMIT },
        ]);
      } catch {
        businesses = [];
      }
      // Fall back to regular query if geo returns nothing (e.g. documents
      // haven't been migrated to have the geo field yet).
      if (businesses.length === 0) {
        businesses = await User.find(baseFilter)
          .sort({ createdAt: -1 })
          .limit(RESULT_LIMIT)
          .lean();
      }
    } else {
      // Fallback — city / text filter (original behaviour)
      businesses = await User.find(baseFilter)
        .sort({ createdAt: -1 })
        .limit(RESULT_LIMIT)
        .lean();
    }

    // Collect keys for batch lookups
    const businessSlugs = businesses.map((b: any) =>
      b.business_name?.toLowerCase().replace(/[^a-z0-9]/g, ""),
    );
    const businessHexIds = businesses.map((b: any) => b._id.toString());

    // Fetch reviews and services in parallel
    const [reviews, services] = await Promise.all([
      Review.find({ business_id: { $in: businessSlugs } }).lean(),
      Service.find({ business_id: { $in: businessHexIds } }).lean(),
    ]);

    // Build O(n) lookup maps instead of O(n²) nested filters
    const reviewsBySlug = new Map<string, typeof reviews>();
    for (const review of reviews) {
      const slug = review.business_id as string;
      if (!reviewsBySlug.has(slug)) reviewsBySlug.set(slug, []);
      reviewsBySlug.get(slug)!.push(review);
    }

    const servicesByBusinessId = new Map<string, typeof services>();
    for (const service of services) {
      const id = service.business_id.toString();
      if (!servicesByBusinessId.has(id)) servicesByBusinessId.set(id, []);
      servicesByBusinessId.get(id)!.push(service);
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
