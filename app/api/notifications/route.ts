import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import Notification from "@/server/models/Notification.model";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user as any).category !== "business") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const business_id = session.user.id;

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
