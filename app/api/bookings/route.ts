import { z } from "zod";
import { connectToDb } from "@/lib/db";
import { NextResponse } from "next/server";
import { Service } from "@/server/models/Service.model";
import Booking from "@/server/models/Booking.model";
import { BookingLock } from "@/server/models/BookingLock.model";

export const create_booking_schema = z.object({
  business_id: z.string(),
  service_id: z.string(),
  employee_id: z.string().nullable(),
  start_time: z.string().datetime(),
  total_price: z.number().positive(),
  user_id: z.string(),
  lock_id: z.string(),
});

export async function POST(request: Request) {
  try {
    await connectToDb();
    const body = await request.json();

    const validated_data = create_booking_schema.parse(body);

    const service = await Service.findById(validated_data.service_id);
    if (!service) throw new Error("Service not found");

    const start_date = new Date(validated_data.start_time);
    const end_date = new Date(
      start_date.getTime() + service.base_duration * 60000,
    );

    const new_booking = await Booking.create({
      ...validated_data,
      end_time: end_date,
      duration: service.base_duration,
      status: "confirmed",
      payment_status: "paid",
    });

    await BookingLock.findByIdAndDelete(validated_data.lock_id);

    return NextResponse.json({
      success: true,
      message: "Booking confirmed",
      data: new_booking,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
