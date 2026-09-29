import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../auth/[...nextauth]/route";
import Event from "@/server/models/Event.model";
import { deleteFromS3 } from "@/server/lib/function";

type RouteContext = {
  params: Promise<{ id: string }>;
};
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await connectToDb();

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const currentUserCategory = (session.user as any).category;

    if (currentUserCategory !== "super-admin") {
      return NextResponse.json(
        { error: "You are not authorized to delete this event" },
        { status: 403 },
      );
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    await deleteFromS3(event.image);
    await Event.findByIdAndDelete(eventId);

    return NextResponse.json({ message: "Review deleted successfully" });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
