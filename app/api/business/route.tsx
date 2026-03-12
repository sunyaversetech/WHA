import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { Review } from "@/server/models/Review.model";
import { NextRequest, NextResponse } from "next/server";

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

    const category = rawCategory.replace(/\?+$/, "").trim();
    const search = rawSearch.replace(/\?+$/, "").trim();
    const city = rawCity.replace(/\?+$/, "").trim();
    const community = rawCommunity.replace(/\?+$/, "").trim();

    const query: any = { category: "business" };

    if (category && category !== "all") {
      query.business_category = category;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      query.name = { $regex: safeSearch, $options: "i" };
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

    const businesses = await User.find(query).sort({ createdAt: -1 }).lean();

    const businessIds = businesses.map((b) => b._id);
    const reviews = await Review.find({
      business_id: { $in: businessIds },
    })
      .sort({ createdAt: -1 })
      .lean();

    const businessesWithReviews = businesses.map((business) => {
      const businessIdStr = business._id?.toString();
      return {
        ...business,
        reviews: reviews.filter((review) => {
          const reviewBusinessIdStr = review.business_id?.toString();

          return reviewBusinessIdStr === businessIdStr;
        }),
      };
    });

    return NextResponse.json(
      {
        data: businessesWithReviews,
        message: "Businesses and reviews retrieved successfully",
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
