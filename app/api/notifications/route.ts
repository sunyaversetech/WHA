import { connectToDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { requireBusinessUser } from "@/server/lib/businessAuth";
import Notification from "@/server/models/Notification.model";

export async function GET(req: Request) {
  const auth = await requireBusinessUser(req, { webNotBusiness: { body: { error: "Unauthorized" }, status: 401 } });
  if (!auth.user) return auth.response;
  const business_id = auth.user.id;

  await connectToDb();

  const [notifications, unread_count] = await Promise.all([
    Notification.find({ business_id })
      .sort({ created_at: -1 })
      .limit(50)
      .lean(),
    Notification.countDocuments({ business_id, is_read: false }),
  ]);

  return NextResponse.json({ data: notifications, unread_count });
}

/** Mark every unread notification of the signed-in business as read. */
export async function PATCH(req: Request) {
  const auth = await requireBusinessUser(req, { webNotBusiness: { body: { error: "Unauthorized" }, status: 401 } });
  if (!auth.user) return auth.response;

  await connectToDb();

  const result = await Notification.updateMany(
    { business_id: auth.user.id, is_read: false },
    { is_read: true },
  );

  return NextResponse.json({ data: { updated: result.modifiedCount }, unread_count: 0 });
}
