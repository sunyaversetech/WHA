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
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();

    const title = formData.get("title") as string;
    const price_category = formData.get("price_category") as string;
    const ticket_link = formData.get("ticket_link") as string;
    const ticket_price = formData.get("ticket_price") as string;
    const price = formData.get("price") as string;
    const description = formData.get("description") as string;
    const file = formData.get("image") as File;
    const location = formData.get("location") as File;
    const venue = formData.get("venue") as string;
    const category = formData.get("category") as string;
    const date = formData.get("date") as string;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);

    if (!file || !title) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadToS3(buffer, file.name, file.type);

    // const newDeal = await Event.create({
    //   title,
    //   expiryDate: new Date(expiryDate),
    //   image: uploadResult.Location,
    //   user: (session.user as any).id,
    //   business_name: (session.user as any).business_name,

    // });

    const newEvent = await Event.create({
      title,
      description,
      date,
      user: (session.user as any).id,
      venue,
      category,
      image: uploadResult.Location,
      price,
      latitude,
      longitude,
      price_category,
      location,
      ticket_link,
      ticket_price,
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

    const { searchParams } = new URL(request.url);
    const isPersonal = searchParams.get("personal") === "true";

    if (!isPersonal) {
      const allEvents = await Event.find({}).sort({ date: 1 });
      return NextResponse.json({ data: allEvents }, { status: 200 });
    }

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
