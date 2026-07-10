import { connectToDb } from "@/lib/db";
import Booking from "@/server/models/Booking.model";
import { Employee } from "@/server/models/Employee.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

const VALID_STATUSES = [
  "pending", "confirmed", "rescheduled", "completed", "cancelled", "no_show", "refunded",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectToDb();

    const { id } = await params;
    const booking = await Booking.findById(id);
    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (String(booking.business_id) !== String(session.user.id)) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    // Employee reassignment
    if (body.employee_id !== undefined) {
      if (body.employee_id) {
        const emp = await Employee.findById(body.employee_id);
        if (!emp) {
          return NextResponse.json({ success: false, error: "Employee not found" }, { status: 404 });
        }
      }
      booking.employee_id = body.employee_id || null;
    }

    // Reschedule — update time
    if (body.start_time) {
      const newStart = new Date(body.start_time);
      if (isNaN(newStart.getTime())) {
        return NextResponse.json({ success: false, error: "Invalid start_time" }, { status: 422 });
      }
      const duration = body.duration ?? booking.duration;
      booking.start_time = newStart;
      booking.end_time = new Date(newStart.getTime() + duration * 60_000);
      booking.duration = duration;
    }

    // Status update (admin can set any valid status directly)
    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ success: false, error: `Invalid status: ${body.status}` }, { status: 422 });
      }
      booking.status = body.status;
    }

    // Use updateOne to bypass any stale enum validator from model cache
    await Booking.updateOne(
      { _id: id },
      {
        $set: {
          ...(body.employee_id !== undefined ? { employee_id: booking.employee_id } : {}),
          ...(body.start_time ? {
            start_time: booking.start_time,
            end_time: booking.end_time,
            duration: booking.duration,
          } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
        },
      },
    );

    const updated = await Booking.findById(id)
      .populate("service_id", "name service_type base_price base_duration")
      .populate("employee_id", "full_name calendar_color employee_photo job_title")
      .populate("user_id", "name email")
      .lean();

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error("[PATCH /api/bookings/[id]]", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
