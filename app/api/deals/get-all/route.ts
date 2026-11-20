import { NextRequest, NextResponse } from "next/server";
import { getDealsListData } from "@/server/lib/getDealsListData";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const data = await getDealsListData({
      category: searchParams.get("category"),
      search: searchParams.get("search"),
      from: searchParams.get("from"),
      to: searchParams.get("to"),
      city: searchParams.get("city"),
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
