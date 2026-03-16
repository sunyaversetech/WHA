import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import Event from "@/server/models/Event.model";
import { Deal } from "@/server/models/DealSchema.model";
import { Category } from "@/server/models/Service.schema";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (session.user.category !== "super-admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDb();
  const user = await User.findOne({ _id: session.user.id });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  await Event.deleteMany({ user: user._id });
  await Deal.deleteMany({ user: user._id });
  await Category.deleteMany({ user: user._id });
  await User.findByIdAndDelete(user._id);
  return NextResponse.json(user);
}
