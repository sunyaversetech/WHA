import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import Favorite from "@/server/models/Favroite.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import "@/server/models/Event.model";
import "@/server/models/Service.schema";
import "@/server/models/DealSchema.model";
export async function POST(req: Request) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { item_id, item_type } = await req.json();

    const capitalized_type =
      item_type.charAt(0).toUpperCase() + item_type.slice(1);

    const existing_favorite = await Favorite.findOne({
      user_id: session.user.id,
      item_id: item_id,
      item_type: capitalized_type,
    });

    if (existing_favorite) {
      await Favorite.findByIdAndDelete(existing_favorite._id);

      return NextResponse.json({
        success: true,
        is_favorited: false,
        message: "Removed from favorites",
      });
    } else {
      await Favorite.create({
        user_id: session.user.id,
        item_id: item_id,
        item_type: capitalized_type,
      });

      return NextResponse.json({
        success: true,
        is_favorited: true,
        message: "Added to favorites",
      });
    }
  } catch (error: any) {
    console.error("Favorite Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const favorite_docs = await Favorite.find({
      user_id: session.user.id,
    }).populate({
      path: "item_id",
    });

    const formatted_favorites = {
      events: favorite_docs
        .filter((f) => f.item_type === "Event")
        .map((f) => f.item_id),
      services: favorite_docs
        .filter((f) => f.item_type === "Service")
        .map((f) => f.item_id),
      deals: favorite_docs
        .filter((f) => f.item_type === "Deal")
        .map((f) => f.item_id),
    };

    return NextResponse.json(
      { data: formatted_favorites, message: "Success" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
