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

    if (from || to) {
      const searchFrom = from ? new Date(from) : null;
      const searchTo = to ? new Date(to) : null;

      const dateQuery: any = {};

      if (searchFrom) {
        dateQuery.$gte = searchFrom;
      }
      if (searchTo) {
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
