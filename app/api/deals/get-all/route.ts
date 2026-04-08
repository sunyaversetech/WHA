import { connectToDb } from "@/lib/db";
import { Deal } from "@/server/models/DealSchema.model";
import { NextRequest, NextResponse } from "next/server";
function escapeRegex(text: string) {
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}

export async function GET(request: NextRequest) {
  try {
    await connectToDb();
    const { searchParams } = new URL(request.url);
    const rawCategory = searchParams.get("category") || "";
    const category = rawCategory.replace(/\?+$/, "").trim();
    const rawSearch = searchParams.get("search") || "";
    const search = rawSearch.replace(/\?+$/, "").trim();
    const rawFrom = searchParams.get("from") || "";
    const rawTo = searchParams.get("to") || "";
    const from = rawFrom.replace(/\?+$/, "").trim();
    const to = rawTo.replace(/\?+$/, "").trim();
    const rawCity = searchParams.get("city") || "";
    const city = rawCity.replace(/\?+$/, "").trim();

    const query: any = {};

    if (search) {
      const safeSearch = escapeRegex(search);
      query.title = { $regex: safeSearch, $options: "i" };
    }

    if (city) {
      query.city = { $regex: `^${escapeRegex(city)}$`, $options: "i" };
    }

    // if (from || to) {
    //   const dateQuery: any = {};

    //   if (from) {
    //     const searchFrom = new Date(from);
    //     searchFrom.setHours(0, 0, 0, 0);
    //     dateQuery["dateRange.to"] = { $gte: searchFrom };
    //   }

    //   if (to) {
    //     const searchTo = new Date(to);
    //     searchTo.setHours(23, 59, 59, 999);
    //     dateQuery["dateRange.from"] = { $lte: searchTo };
    //   }
    //   Object.assign(query, dateQuery);
    // }

    if (from || to) {
      const dateQuery: any = {};
      if (from) {
        const searchFrom = new Date(from);
        searchFrom.setHours(0, 0, 0, 0);
        dateQuery.$gte = searchFrom;
      }
      if (to) {
        const searchTo = new Date(to);
        searchTo.setHours(23, 59, 59, 999);
        dateQuery.$lte = searchTo;
      }

      query.valid_till = dateQuery;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    const deals = await Deal.find(query).populate("user").sort({
      createdAt: -1,
    });
    return NextResponse.json({ message: "", data: deals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
