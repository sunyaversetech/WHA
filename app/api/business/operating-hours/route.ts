import { NextResponse } from "next/server";
import { OperatingHours } from "@/server/models/OperatingHour.model";
import { connectToDb } from "@/lib/db";
import { requireBusinessUser } from "@/server/lib/businessAuth";

export async function GET(req: Request) {
  try {
    await connectToDb();
    const auth = await requireBusinessUser(req);
    if (!auth.user) return auth.response;

    const currentUserId = auth.user.id;
    const hours = await OperatingHours.findOne({ business_id: currentUserId });

    if (!hours) {
      return NextResponse.json({ message: "No hours found" }, { status: 404 });
    }

    return NextResponse.json(
      { data: hours, message: "Hours fetched successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    await connectToDb();
    const auth = await requireBusinessUser(req);
    if (!auth.user) return auth.response;
    const body = await req.json();

    // The signed-in business only — body.business_id is ignored.
    const updatedHours = await OperatingHours.findOneAndUpdate(
      { business_id: auth.user.id },
      {
        is24_7: body.is24_7,
        schedule: body.schedule,
      },
      { upsert: true, new: true, runValidators: true },
    );
    return NextResponse.json(updatedHours, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
