import { connectToDb } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { requireBusinessUser } from "@/server/lib/businessAuth";
import { Deal } from "@/server/models/DealSchema.model";

type RouteContext = {
  params: Promise<{ id: string }>;
};
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    await connectToDb();

    const auth = await requireBusinessUser(req);
    if (!auth.user) return auth.response;

    const { id: dealId } = await params;
    const currentUserId = auth.user.id;
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
