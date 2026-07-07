import { connectToDb } from "@/lib/db";
import { Resource } from "@/server/models/Resource.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resources = await Resource.find({
      business_id: (session.user as any).id,
    }).lean();

    return NextResponse.json({ success: true, data: resources }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const business_id = (session.user as any).id;
    const body = await request.json();

    const {
      name,
      description,
      category_id,
      category,
      price_type,
      base_price,
      base_duration,
      buffer_time,
      availability_type,
      availability_schedule,
      allow_multiple_bookings,
      max_concurrent_bookings,
      is_active,
    } = body;

    const resource = await Resource.create({
      business_id,
      name: name?.trim(),
      description: description ?? "",
      category_id: category_id ?? null,
      category: category ?? "",
      price_type: price_type ?? "Fixed",
      base_price: base_price ?? 0,
      base_duration: base_duration ?? 60,
      buffer_time: buffer_time ?? 0,
      availability_type: availability_type ?? "always",
      availability_schedule: availability_schedule ?? [],
      allow_multiple_bookings: allow_multiple_bookings ?? false,
      max_concurrent_bookings: max_concurrent_bookings ?? 1,
      is_active: is_active !== undefined ? is_active : true,
    });

    return NextResponse.json({ success: true, data: resource }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: "A resource with this name already exists for your business." },
        { status: 400 },
      );
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
