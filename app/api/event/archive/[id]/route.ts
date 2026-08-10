import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getEventStatus(event: any): "upcoming" | "live" | "past" {
  const from = event.dateRange?.from ? new Date(event.dateRange.from) : null;
  if (!from || isNaN(from.getTime())) return "past";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  from.setHours(0, 0, 0, 0);

  const to =
    event.dateRange?.to && !isNaN(new Date(event.dateRange.to).getTime())
      ? new Date(event.dateRange.to)
      : new Date(from);
  to.setHours(0, 0, 0, 0);

  if (today < from) return "upcoming";
  if (today > to) return "past";
  return "live";
}

function getTicketsTakenCount(event: any): number {
  if (event.price_category === "paid") {
    return (event.options || []).reduce(
      (sum: number, o: any) => sum + (o.sold || 0),
      0,
    );
  }
  if (event.price_category === "registration") {
    return event.registration_sold || 0;
  }
  return 0;
}

export async function POST(req: Request, { params }: RouteContext) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isOwner = event.user.toString() === session.user.id;
    const isSuperAdmin = session.user.category === "super-admin";
    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You can only archive your own events" },
        { status: 403 },
      );
    }

    if (!event.archived) {
      const status = getEventStatus(event);
      const ticketsTaken = getTicketsTakenCount(event);
      if (status !== "past" && ticketsTaken > 0) {
        return NextResponse.json(
          {
            error:
              "This event can't be archived while it still has tickets taken. You can archive it once the event has ended.",
          },
          { status: 400 },
        );
      }
    }

    event.archived = !event.archived;
    await event.save();

    return NextResponse.json({
      message: event.archived ? "Event archived" : "Event unarchived",
      data: event,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
