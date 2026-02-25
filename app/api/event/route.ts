import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import { uploadToS3 } from "@/server/lib/function";
import Event from "@/server/models/Event.model";

export async function POST(req: NextRequest) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const venue = formData.get("venue") as string;
    const city = formData.get("city") as string;
    const community = formData.get("community") as string;
    const category = formData.get("category") as string;
    const location = formData.get("location") as string;

    const price_category = formData.get("price_category") as string;
    const ticket_link = formData.get("ticket_link") as string;
    const ticket_price = formData.get("ticket_price") as string;

    const dateFrom =
      formData.get("startDate") || formData.get("dateRange[from]");
    const dateTo = formData.get("endDate") || formData.get("dateRange[to]");
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;

    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);

    const file = formData.get("image") as File;

    if (!file || !title || !dateFrom || !dateTo) {
      return NextResponse.json(
        { error: "Missing required fields (Title, Image, or Dates)" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadToS3(buffer, file.name, file.type);

    const newEvent = await Event.create({
      title,
      description,
      venue,
      city,
      community,
      category,
      image: uploadResult.Location,

      dateRange: {
        from: new Date(dateFrom as string),
        to: new Date(dateTo as string),
      },

      startTime,
      endTime,

      price_category,
      ticket_link: price_category === "paid" ? ticket_link : undefined,
      ticket_price: price_category === "paid" ? ticket_price : "0",

      location,
      latitude,
      longitude,

      user: (session.user as any).id,
    });

    return NextResponse.json(
      { data: newEvent, message: "Event created successfully" },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Event Creation Error:", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectToDb();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const myEvents = await Event.find({ user: (session.user as any).id }).sort({
      createdAt: -1,
    });

    return NextResponse.json(
      { data: myEvents, message: "User events retrieved" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
