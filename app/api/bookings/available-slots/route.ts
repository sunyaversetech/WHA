import { z, ZodError } from "zod";
import { NextResponse } from "next/server";
import { connectToDb } from "@/lib/db";
import { Service } from "@/server/models/Service.model";
import { logger } from "@/lib/logger";
import { computeAvailableSlotsForService } from "@/server/lib/availableSlots";

const query_schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  service_id: z.string().min(1),
  employee_id: z.string().min(1).optional(),
  timezone: z.string().min(1).default("UTC"),
  business_id: z.string().min(1).optional(),
  duration_minutes: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  let params: z.infer<typeof query_schema>;
  try {
    params = query_schema.parse({
      date: searchParams.get("date"),
      service_id: searchParams.get("service_id"),
      employee_id: searchParams.get("employee_id") ?? undefined,
      timezone: searchParams.get("timezone") ?? "UTC",
      business_id: searchParams.get("business_id") ?? undefined,
      duration_minutes: searchParams.get("duration_minutes") ?? undefined,
    });
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

  // Compute "today" in the user's local timezone, not server UTC
  const local_today = new Intl.DateTimeFormat("en-CA", {
    timeZone: params.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  if (params.date < local_today) {
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

    const service: any = await Service.findById(params.service_id).lean();
    if (!service) {
      return NextResponse.json(
        { success: false, code: "SERVICE_NOT_FOUND" },
        { status: 404 },
      );
    }
    if (!service.is_active) {
      return NextResponse.json(
        { success: false, code: "SERVICE_UNAVAILABLE" },
        { status: 400 },
      );
    }

    const result = await computeAvailableSlotsForService(service, {
      date: params.date,
      timezone: params.timezone,
      employee_id: params.employee_id,
      business_id: params.business_id,
      duration_minutes: params.duration_minutes
        ? parseInt(params.duration_minutes, 10)
        : undefined,
    });

    return NextResponse.json({
      success: true,
      count: result.available_slots.length,
      available_slots: result.available_slots,
      ...(result.slot_remaining ? { slot_remaining: result.slot_remaining } : {}),
    });
  } catch (error: unknown) {
    logger.error({ error }, "Available slots fetch failed");
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
