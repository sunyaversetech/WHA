import { NextRequest, NextResponse } from "next/server";
import { getBusinessListData } from "@/server/lib/getBusinessListData";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const data = await getBusinessListData({
      category: searchParams.get("category"),
      search: searchParams.get("search"),
      service: searchParams.get("service"),
      city: searchParams.get("city"),
      community: searchParams.get("community"),
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      radius: searchParams.get("radius"),
      swLat: searchParams.get("swLat"),
      swLng: searchParams.get("swLng"),
      neLat: searchParams.get("neLat"),
      neLng: searchParams.get("neLng"),
    });

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
