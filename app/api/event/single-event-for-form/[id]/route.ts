import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";
import { NextRequest, NextResponse } from "next/server";
import { requireBusinessUser } from "@/server/lib/businessAuth";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  try {
    await connectToDb();

    const auth = await requireBusinessUser(request, { messageKey: "message", allowSuperAdmin: true });
    if (!auth.user) return auth.response;

    const { id } = await params;

    const event = await Event.findById(id)
      .populate("user", "email business_name")
      .lean();
    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    const isOwner =
      (event as any).user?._id?.toString() === auth.user.id;
    const isSuperAdmin = auth.user.category === "super-admin";
    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      message: "Event fetched successfully",
      data: event,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
