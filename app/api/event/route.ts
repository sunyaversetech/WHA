import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import { uploadToS3 } from "@/server/lib/function";
import Event from "@/server/models/Event.model";
import { generateSlug } from "./edit/[id]/route";

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
    const location_tba = formData.get("location_tba") === "true";
    const email = formData.get("email") as string;
    const phone_number = formData.get("phone_number") as string;
    const website_link = formData.get("website_link") as string;
    const dateRangeRaw = formData.get("dateRange") as string;
    const price_category = formData.get("price_category") as string;
    const ticket_link = formData.get("ticket_link") as string;
    const optionsRaw = formData.get("options") as string;
    const promoCodesRaw = formData.get("promo_codes") as string;
    const event_rules = formData.get("event_rules") as string;
    const refund_policy = formData.get("refund_policy") as string;
    const host_name = formData.get("host_name") as string;
    const support_details = formData.get("support_details") as string;
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    const latitude = parseFloat(formData.get("latitude") as string);
    const longitude = parseFloat(formData.get("longitude") as string);
    const registration_capacity = formData.get(
      "registration_capacity",
    ) as string;
    const max_tickets_per_request = formData.get(
      "max_tickets_per_request",
    ) as string;
    const show_remaining_tickets =
      formData.get("show_remaining_tickets") !== "false";

    const slug = generateSlug(title);

    const file = formData.get("image") as File;

    let options: any[] = [];
    if (optionsRaw) {
      try {
        options = JSON.parse(optionsRaw);
      } catch (e) {
        console.error("Failed to parse options:", e);
      }
    }

    let promo_codes: any[] = [];
    if (promoCodesRaw) {
      try {
        promo_codes = JSON.parse(promoCodesRaw);
      } catch (e) {
        console.error("Failed to parse promo_codes:", e);
      }
    }

    const formattedDates: { dateFrom?: string; dateTo?: string } = {};

    if (dateRangeRaw) {
      try {
        const parsedRange = JSON.parse(dateRangeRaw);

        if (parsedRange.from) {
          formattedDates.dateFrom = parsedRange.from.split("T")[0];
        }

        if (parsedRange.to) {
          formattedDates.dateTo = parsedRange.to.split("T")[0];
        }
      } catch (e) {
        console.error("Failed to parse dateRange:", e);
      }
    }

    // if (dateRangeRaw) {
    //   try {
    //     const parsedRange = JSON.parse(dateRangeRaw);
    //     dateFrom = parsedRange.from.split("T")[0];
    //     dateTo = parsedRange.to.split("T")[0];
    //   } catch (e) {
    //     console.error("Failed to parse dateRange:", e);
    //   }
    // }

    if (!file || !title || !dateRangeRaw) {
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
      email,
      phone_number,
      website_link,
      city,
      community,
      slug,
      category,
      image: uploadResult.Location,

      dateRange: {
        from: formattedDates.dateFrom,
        to: formattedDates.dateTo,
      },

      startTime,
      endTime,

      price_category,
      ticket_link: price_category === "external" ? ticket_link : undefined,
      options: price_category === "paid" ? options : undefined,
      promo_codes: price_category === "paid" ? promo_codes : undefined,
      registration_capacity:
        price_category === "registration" && registration_capacity
          ? Number(registration_capacity)
          : undefined,
      max_tickets_per_request: max_tickets_per_request
        ? Number(max_tickets_per_request)
        : 10,
      show_remaining_tickets,

      event_rules,
      refund_policy,
      host_name,
      support_details,

      location,
      location_tba,
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

export async function GET() {
  try {
    await connectToDb();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const myEvents = await Event.find({ user: (session.user as any).id })
      .sort({
        createdAt: -1,
      })
      .select("-options.promo_code -promo_codes");

    return NextResponse.json(
      { data: myEvents, message: "User events retrieved" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
