import { connectToDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireBusinessUser } from "@/server/lib/businessAuth";
import Notification from "@/server/models/Notification.model";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireBusinessUser(request);
  if (!auth.user) return auth.response;
  const { id } = await params;

  await connectToDb();

  const notification = await Notification.findOneAndUpdate(
    { _id: id, business_id: auth.user.id },
    { is_read: true },
    { new: true },
  );

  if (!notification) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: notification });
}
