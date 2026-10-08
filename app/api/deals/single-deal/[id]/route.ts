import { connectToDb } from "@/lib/db";
import { Deal } from "@/server/models/DealSchema.model";
import { NextRequest, NextResponse } from "next/server";
import { PUBLIC_ORGANIZER_FIELDS } from "@/server/lib/publicUserFields";
import { slugOrIdFilter } from "@/server/lib/slug";

type Props = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: Props) {
  try {
    await connectToDb();

    const { id } = await params;

    // Accepts either the new slug or a legacy raw id, so old /deals/<id>
    // links and bookmarks keep resolving after the slug migration.
    const deal = await Deal.findOne(slugOrIdFilter(id)).populate(
      "user",
      PUBLIC_ORGANIZER_FIELDS,
    );
    if (!deal) {
      return NextResponse.json({ message: "deal not found" }, { status: 404 });
    }
    return NextResponse.json({
      message: "deal fetched successfully",
      data: deal,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
