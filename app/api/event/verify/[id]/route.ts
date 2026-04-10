import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import { EventRedemption } from "@/server/models/EventCodeRemtion.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: any) {
  try {
    await connectToDb();
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const event = await EventRedemption.find({
      event: id,
      verifiedAt: { $ne: null },
    })
      .populate("user", { _id: 1, name: 1 })
      .lean();

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    return NextResponse.json({
      message: "EventRedemption fetched successfully",
      data: event,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
