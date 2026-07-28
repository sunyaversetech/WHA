import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import Notification from "@/server/models/Notification.model";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  await connectToDb();

  const notification = await Notification.findOneAndUpdate(
    { _id: id, business_id: session.user.id },
    { is_read: true },
    { new: true },
  );

  if (!notification) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: notification });
}
