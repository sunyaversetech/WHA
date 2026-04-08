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
  email: z.email("Invalid email address").optional().or(z.literal("")),
  phone_number: z.string().optional().or(z.literal("")),
  website_link: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  category_name: z.string().optional(),
  price_category: z.enum(["free", "paid", "registration"]),
  ticket_link: z.string().optional(),
  ticket_price: z.preprocess(
    (val) => (val === "" || val === "undefined" ? 0 : val),
    z.coerce.number().optional(),
  ),
  community: z.string().min(1, "Community is required"),
  community_name: z.string().optional(),
  city: z.string().min(2, "City is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required"),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
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

    const validatedData = eventSchema.partial().parse(rawData);

    const event = await Event.findById(eventId);
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
        try {
          await deleteFromS3(event.image);
        } catch (e) {
          console.error("Failed to delete old image, continuing...", e);
        }
      }
      const buffer = Buffer.from(await imageField.arrayBuffer());
      const s3Response = await uploadToS3(
        buffer,
        imageField.name,
        imageField.type,
      );

      finalImageUrl = s3Response.Location;
    }

    const defaultEmptyFields = {
      email: "",
      phone_number: "",
      website_link: "",
      ticket_link: "",
      ticket_price: "",
      category_name: "",
      community_name: "",
      endTime: "",
    };

    const updatePayload = {
      ...defaultEmptyFields,
      ...validatedData,
      image: finalImageUrl,
    };

    if (
      updatePayload.ticket_price === "" ||
      updatePayload.ticket_price === "undefined"
    ) {
      updatePayload.ticket_price = 0;
    } else if (updatePayload.ticket_price) {
      updatePayload.ticket_price = Number(updatePayload.ticket_price);
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      {
        $set: updatePayload,
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
