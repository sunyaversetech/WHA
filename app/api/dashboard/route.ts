import { connectToDb } from "@/lib/db";
import { Redemption } from "@/server/models/CouponCodeRedemtion.model";
import { Deal } from "@/server/models/DealSchema.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";
import Favorite from "@/server/models/Favroite.model";
import Event from "@/server/models/Event.model";

export async function GET() {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.category === "user") {
      const deals = await Redemption.find({
        user: (session.user as any).id,
      }).lean();
      const favorite = await Favorite.find({
        user_id: (session.user as any).id,
      })
        .populate("item_id")
        .lean();
      return NextResponse.json(
        {
          message: "dashboard fetched successfully",
          data: { favorite: favorite.slice(0, 2), deals: deals.slice(0, 2) },
        },
        { status: 200 },
      );
    } else if (session.user.category === "business") {
      const myEvents = await Event.find({
        user: (session.user as any).id,
      }).sort({
        createdAt: -1,
      });
      const mydeals = await Deal.find({ user: (session.user as any).id });
      return NextResponse.json(
        {
          message: "dashboard fetched successfully",
          data: [...myEvents, ...mydeals],
        },
        { status: 200 },
      );
    }

    // return NextResponse.json({ message: "", data: dealsWithCounts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
