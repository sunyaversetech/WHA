import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDb } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import Event from "@/server/models/Event.model";
import { uploadToS3, deleteFromS3 } from "@/server/lib/function";

export function generateSlug(title: string) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "");
}

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
    from: z.string(),
    to: z.string(),
  }),
  email: z.email("Invalid email address").optional().or(z.literal("")),
  phone_number: z.string().optional().or(z.literal("")),
  website_link: z.string().optional(),
  slug: z.string(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  category_name: z.string().optional(),
  price_category: z.enum(["registration", "paid", "external"]),
  ticket_link: z.string().optional(),
  registration_capacity: z.preprocess(
    (val) => (val === "" || val === "undefined" ? null : val),
    z.coerce.number().nullable().optional(),
  ),
  max_tickets_per_request: z.preprocess(
    (val) => (val === "" || val === "undefined" ? 10 : val),
    z.coerce.number().optional(),
  ),
  show_remaining_tickets: z.preprocess(
    (val) => (val === "true" ? true : val === "false" ? false : val),
    z.boolean().optional(),
  ),
  options: z
    .array(
      z.object({
        _id: z.string().optional(),
        name: z.string().optional(),
        release_date: z.string().optional(),
        close_date: z.string().optional(),
        price: z.preprocess(
          (val) => (val === "" || val === "undefined" ? 0 : val),
          z.coerce.number().optional(),
        ),
        capacity: z.preprocess(
          (val) => (val === "" || val === "undefined" ? 0 : val),
          z.coerce.number().optional(),
        ),
      }),
    )
    .max(5, "You can add up to 5 options")
    .optional(),
  promo_codes: z
    .array(
      z.object({
        _id: z.string().optional(),
        code: z.string().optional(),
        discount_percentage: z.preprocess(
          (val) => (val === "" || val === "undefined" ? 0 : val),
          z.coerce.number().optional(),
        ),
        limit: z.preprocess(
          (val) => (val === "" || val === "undefined" ? 0 : val),
          z.coerce.number().optional(),
        ),
        applicable_options: z.array(z.string()).optional(),
      }),
    )
    .max(5, "You can add up to 5 promo codes")
    .optional(),
  event_rules: z.string().optional(),
  refund_policy: z.string().optional(),
  host_name: z.string().optional(),
  support_details: z.string().optional(),
  community: z.string().min(1, "Community is required"),
  community_name: z.string().optional(),
  city: z.string().min(2, "City is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location_tba: z.preprocess(
    (val) => (val === "true" ? true : val === "false" ? false : val),
    z.boolean().optional(),
  ),
  location: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
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
        } catch {
          rawData[key] = value;
        }
      } else {
        rawData[key] = value;
      }
    });

    const validatedData = eventSchema.partial().parse(rawData);

    const event = await Event.findById(eventId);
    const isOwner = event.user.toString() === userId;
    const isSuperAdmin = session?.user?.category === "super-admin";
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (!isOwner && !isSuperAdmin) {
      return NextResponse.json(
        { error: "You can only edit your own events" },
        { status: 403 },
      );
    }

    if (validatedData.dateRange?.to && event.dateRange?.to) {
      const newEnd = new Date(validatedData.dateRange.to);
      const currentEnd = new Date(event.dateRange.to);
      if (
        !isNaN(newEnd.getTime()) &&
        !isNaN(currentEnd.getTime()) &&
        newEnd.getTime() < currentEnd.getTime()
      ) {
        return NextResponse.json(
          {
            error:
              "End date cannot be set earlier than the event's current end date.",
          },
          { status: 400 },
        );
      }
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
      options: [] as any[],
      promo_codes: [] as any[],
      category_name: "",
      community_name: "",
      endTime: "",
    };

    // Editing only sends the fields the form actually manages — sold/used
    // counters are maintained server-side by the purchase/redemption flows,
    // so they must be carried over from the existing document by _id or a
    // full-array $set would silently reset them to their schema default.
    const mergedOptions = (validatedData.options || []).map((opt: any) => {
      const existing = opt._id
        ? (event.options || []).find((o: any) => o._id.toString() === opt._id)
        : null;
      return { ...opt, sold: existing?.sold || 0 };
    });
    const mergedPromoCodes = (validatedData.promo_codes || []).map(
      (promo: any) => {
        const existing = promo._id
          ? (event.promo_codes || []).find(
              (p: any) => p._id.toString() === promo._id,
            )
          : null;
        return { ...promo, used: existing?.used || 0 };
      },
    );

    const effectiveCategory = validatedData.price_category ?? event.price_category;
    const categoryGatedFields = {
      ticket_link: effectiveCategory === "external" ? validatedData.ticket_link : "",
      options: effectiveCategory === "paid" ? mergedOptions : [],
      promo_codes: effectiveCategory === "paid" ? mergedPromoCodes : [],
      registration_capacity:
        effectiveCategory === "registration"
          ? validatedData.registration_capacity
          : null,
    };

    const updatePayload = {
      ...defaultEmptyFields,
      ...validatedData,
      ...categoryGatedFields,
      image: finalImageUrl,
    };

    if (validatedData.title) {
      updatePayload.slug = generateSlug(validatedData.title);
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      eventId,
      { $set: updatePayload },
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
