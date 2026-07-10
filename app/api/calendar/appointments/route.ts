import { connectToDb } from "@/lib/db";
import Booking from "@/server/models/Booking.model";
import { Service } from "@/server/models/Service.model";
import { Employee } from "@/server/models/Employee.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";
import mongoose from "mongoose";
import { z, ZodError } from "zod";

const schema = z.object({
  service_id: z.string().min(1),
  employee_id: z.string().nullable().optional(),
  start_time: z.string().datetime(),
  duration: z.number().int().min(1),
  customer_name: z.string().optional(),
  notes: z.string().optional(),
  total_price: z.number().min(0).optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await connectToDb();

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await request.json());
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: e.issues.map((i) => i.message).join("; ") },
        { status: 422 },
      );
    }
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 });
  }

  const service = await Service.findById(body.service_id).lean();
  if (!service) {
    return NextResponse.json({ success: false, error: "Service not found" }, { status: 404 });
  }

  if (body.employee_id) {
    const emp = await Employee.findById(body.employee_id).lean();
    if (!emp) {
      return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
    }
  }

  const start = new Date(body.start_time);
  const end = new Date(start.getTime() + body.duration * 60_000);

  const notes = [
    body.customer_name ? `Client: ${body.customer_name}` : null,
    body.notes || null,
  ]
    .filter(Boolean)
    .join(" — ");

  const booking = await Booking.create({
    business_id: session.user.id,
    user_id: new mongoose.Types.ObjectId(session.user.id),
    service_id: body.service_id,
    employee_id: body.employee_id || null,
    start_time: start,
    end_time: end,
    duration: body.duration,
    total_price: body.total_price ?? (service as any).base_price ?? 0,
    currency: "AUD",
    payment_status: "unpaid",
    status: "confirmed",
    notes: notes || undefined,
  });

  return NextResponse.json({ success: true, data: booking }, { status: 201 });
}
