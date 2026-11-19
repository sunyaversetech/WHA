import { z, ZodError } from "zod";
import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import { Service } from "@/server/models/Service.model";
import { logger } from "@/lib/logger";
import { computeAvailableSlotsForService } from "@/server/lib/availableSlots";

// Powers the search-results page: each visible business card shows live
// time-slot buttons for a couple of its services, so rather than one HTTP
// round trip per card (an N+1 waterfall), the client sends every
// {business_id, service_id} it needs slots for in one request.
const MAX_ITEMS = 60;

const body_schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  timezone: z.string().min(1).default("UTC"),
  items: z
    .array(
      z.object({
        business_id: z.string().min(1),
        service_id: z.string().min(1),
      }),
    )
    .min(1)
    .max(MAX_ITEMS),
});

export async function POST(request: Request) {
  let body: z.infer<typeof body_schema>;
  try {
    body = body_schema.parse(await request.json());
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          code: "VALIDATION_ERROR",
          message: error.issues
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join("; "),
        },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { success: false, code: "INVALID_PARAMS" },
      { status: 400 },
    );
  }

  const local_today = new Intl.DateTimeFormat("en-CA", {
    timeZone: body.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (body.date < local_today) {
    return NextResponse.json(
      {
        success: false,
        code: "PAST_DATE",
        message: "Cannot query slots for past dates",
      },
      { status: 400 },
    );
  }

  try {
    await connectToDb();

    const service_ids = Array.from(new Set(body.items.map((i) => i.service_id)));
    const services = await Service.find({ _id: { $in: service_ids } }).lean();
    const service_by_id = new Map(services.map((s: any) => [s._id.toString(), s]));

    const slots: Record<string, { available_slots: string[]; slot_remaining?: Record<string, number> }> = {};

    await Promise.all(
      body.items.map(async (item) => {
        const service: any = service_by_id.get(item.service_id);
        if (!service || !service.is_active) {
          slots[item.service_id] = { available_slots: [] };
          return;
        }
        const result = await computeAvailableSlotsForService(service, {
          date: body.date,
          timezone: body.timezone,
          business_id: item.business_id,
        });
        slots[item.service_id] = result;
      }),
    );

    return NextResponse.json({ success: true, slots });
  } catch (error: unknown) {
    logger.error({ error }, "Batch available slots fetch failed");
    return NextResponse.json(
      {
        success: false,
        code: "INTERNAL_ERROR",
        message: "Unable to fetch slots",
      },
      { status: 500 },
    );
  }
}
