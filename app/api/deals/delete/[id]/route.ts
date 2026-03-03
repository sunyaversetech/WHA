import { connectToDb } from "@/lib/db";
import { Review } from "@/server/models/Review.model";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "../../../auth/[...nextauth]/route";
import { Deal } from "@/server/models/DealSchema.model";
import User from "@/server/models/Auth.model";

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

    const { id: dealId } = await params;
    const currentUserId = (session.user as any).id;
    const deal = await Deal.findById(dealId);

    if (!deal) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (deal.user.toString() !== currentUserId) {
      return NextResponse.json(
        { error: "You are not authorized to delete this deal" },
        { status: 403 },
      );
    }

    await Deal.findByIdAndDelete(dealId);

    return NextResponse.json({ message: "Review deleted successfully" });
  } catch (error: any) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
