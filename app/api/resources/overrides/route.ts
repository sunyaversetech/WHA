import { connectToDb } from "@/lib/db";
import { ResourceOverride } from "@/server/models/ResourceOverride.model";
import { NextResponse } from "next/server";
import { requireBusinessUser } from "@/server/lib/businessAuth";

export async function GET(request: Request) {
  try {
    await connectToDb();
    const auth = await requireBusinessUser(request);
    if (!auth.user) return auth.response;

    const business_id = auth.user.id;
    const { searchParams } = new URL(request.url);
    const week_start = searchParams.get("week_start");
    const week_end = searchParams.get("week_end");

    const query: any = { business_id };
    if (week_start && week_end) {
      query.date = { $gte: week_start, $lte: week_end };
    }

    const overrides = await ResourceOverride.find(query).lean();
    return NextResponse.json({ success: true, data: overrides }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDb();
    const auth = await requireBusinessUser(request);
    if (!auth.user) return auth.response;

    const business_id = auth.user.id;
    const body = await request.json();
    const { service_id, date, is_closed, quantity_override } = body;

    if (!service_id || !date) {
      return NextResponse.json(
        { success: false, error: "service_id and date are required" },
        { status: 400 },
      );
    }

    const override = await ResourceOverride.findOneAndUpdate(
      { service_id, date },
      { $set: { business_id, service_id, date, is_closed: !!is_closed, quantity_override: quantity_override ?? null } },
      { upsert: true, new: true },
    );

    return NextResponse.json({ success: true, data: override }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await connectToDb();
    const auth = await requireBusinessUser(request);
    if (!auth.user) return auth.response;

    const business_id = auth.user.id;
    const { searchParams } = new URL(request.url);
    const service_id = searchParams.get("service_id");
    const date = searchParams.get("date");

    if (!service_id || !date) {
      return NextResponse.json(
        { success: false, error: "service_id and date are required" },
        { status: 400 },
      );
    }

    await ResourceOverride.findOneAndDelete({ business_id, service_id, date });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
