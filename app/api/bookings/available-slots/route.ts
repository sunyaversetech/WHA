import { connectToDb } from "@/lib/db";
import Booking from "@/server/models/Booking.model";
import { BookingLock } from "@/server/models/BookingLock.model";
import { Employee } from "@/server/models/Employee.model";
import { Service } from "@/server/models/Service.model";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date_param = searchParams.get("date"); // e.g., 2026-05-15
  const employee_id = searchParams.get("employee_id");
  const service_id = searchParams.get("service_id");

  try {
    await connectToDb();

    const service = await Service.findById(service_id);
    const employee = await Employee.findById(employee_id);
    if (!service)
      return NextResponse.json({ error: "Service required" }, { status: 400 });

    const slots = [];
    let current_time = new Date(`${date_param}T09:00:00Z`);
    const end_of_day = new Date(`${date_param}T18:00:00Z`);

    const [existing_bookings, existing_locks] = await Promise.all([
      Booking.find({
        employee_id,
        start_time: { $gte: new Date(date_param + "T00:00:00Z") },
        end_time: { $lte: new Date(date_param + "T23:59:59Z") },
        status: { $ne: "cancelled" },
      }),
      BookingLock.find({
        employee_id,
        start_time: { $gte: new Date(date_param + "T00:00:00Z") },
      }),
    ]);

    while (current_time < end_of_day) {
      const slot_end = new Date(
        current_time.getTime() + service.base_duration * 60000,
      );

      const is_booked = [...existing_bookings, ...existing_locks].some((b) => {
        return current_time < b.end_time && slot_end > b.start_time;
      });

      if (!is_booked) {
        slots.push(new Date(current_time));
      }

      current_time = new Date(current_time.getTime() + 30 * 60000);
    }

    return NextResponse.json({ success: true, available_slots: slots });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
