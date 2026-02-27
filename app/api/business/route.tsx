import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
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

    const category = rawCategory.replace(/\?+$/, "").trim();
    const search = rawSearch.replace(/\?+$/, "").trim();

    const query: any = { category: "business" };

    if (category && category !== "all") {
      query.business_category = category;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      query.name = { $regex: safeSearch, $options: "i" };
    }

    const businesses = await User.find(query).sort({
      createdAt: -1,
    });

    return NextResponse.json(
      { data: businesses, message: "Businesses retrieved successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
