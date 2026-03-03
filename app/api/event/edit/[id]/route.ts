import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import Event from "@/server/models/Event.model";
import { uploadToS3, deleteFromS3 } from "@/server/lib/function";

export const eventSchema = z.object({
  _id: z.string().optional(),
  title: z.string().min(2, "Title is required"),
  image: z.union([
    z.string(),
    z
      .any()
      .refine(
        (file) => file instanceof File,
        "Image must be either a string or a file",
      ),
  ]),
  venue: z.string().min(2, "Venue is required"),
  dateRange: z.object({
    from: z.coerce.date(),
    to: z.coerce.date(),
  }),
  email: z.email().min(1, "Email is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  website_link: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  category: z.string().min(1, "Category is required"),
  category_name: z.string().optional(),
  price_category: z.enum(["free", "paid"]),
  ticket_link: z.string().optional(),
  ticket_price: z.string().optional(),
  community: z.string().min(1, "Community is required"),
  community_name: z.string().optional(),
  city: z.string().min(2, "City is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  latitude: z.string(),
  longitude: z.string(),
});
type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: eventId } = await params;
    const userId = (session.user as any).id;

    const formData = await req.formData();

    const rawData: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (
        typeof value === "string" &&
        (value.startsWith("{") || value.startsWith("["))
      ) {
        try {
          rawData[key] = JSON.parse(value);
        } catch (e) {
          rawData[key] = value;
        }
      } else {
        rawData[key] = value;
      }
    });

    console.log("RawData after parsing:", rawData);

    const validatedData = eventSchema.partial().parse(rawData);

    const event = await Event.findById(eventId);
    await deleteFromS3(event.image);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.user.toString() !== userId) {
      return NextResponse.json(
        { error: "You can only edit your own events" },
        { status: 403 },
      );
    }

    const imageField = formData.get("image");
    let finalImageUrl = event.image;

    if (imageField instanceof File && imageField.size > 0) {
      if (event.image) {
        await deleteFromS3(event.image);
      }
      const buffer = Buffer.from(await imageField.arrayBuffer());
      finalImageUrl = await uploadToS3(
        buffer,
        imageField.name,
        imageField.type,
      );
    } else if (typeof imageField === "string" && imageField.trim() !== "") {
      finalImageUrl = imageField;
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        $set: {
          ...validatedData,
          image: finalImageUrl,
        },
      },
      { new: true, runValidators: true },
    );

    return NextResponse.json({
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
