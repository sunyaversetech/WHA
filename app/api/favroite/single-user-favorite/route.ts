import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { NextResponse } from "next/server";

import Favorite from "@/server/models/Favroite.model";
import "@/server/models/Event.model";
import "@/server/models/Service.schema";
import "@/server/models/DealSchema.model";

export async function GET(req: Request) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const favorite_docs = await Favorite.find({
      user_id: session.user.id,
    }).populate("item_id");

    const formatted_favorites = {
      events: favorite_docs
        .filter((f) => f.item_type === "Event" && f.item_id)
        .map((f) => f.item_id),
      services: favorite_docs
        .filter((f) => f.item_type === "Service" && f.item_id)
        .map((f) => f.item_id),
      deals: favorite_docs
        .filter((f) => f.item_type === "Deal" && f.item_id)
        .map((f) => f.item_id),
    };

    return NextResponse.json({ data: formatted_favorites, message: "Success" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
