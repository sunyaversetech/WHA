import { NextResponse } from "next/server";
import { OperatingHours } from "@/server/models/OperatingHour.model";
import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET() {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
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
    const body = await req.json();

    const updatedHours = await OperatingHours.findOneAndUpdate(
      { business_id: body.business_id },
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
