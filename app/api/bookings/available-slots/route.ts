import { connectToDb } from "@/lib/db";
import Booking from "@/server/models/Booking.model";
import { BookingLock } from "@/server/models/BookingLock.model";
import { Employee } from "@/server/models/Employee.model";
import { Service } from "@/server/models/Service.model";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date_param = searchParams.get("date"); // Expects YYYY-MM-DD
  const employee_id = searchParams.get("employee_id"); // Can be null/omitted for "on-site assignment"
  const service_id = searchParams.get("service_id");

  if (!date_param || !service_id) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 },
    );
  }

  try {
    await connectToDb();

    // 1. Fetch Service details
    const service = await Service.findById(service_id);
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // 2. Determine Day of the Week
    const days_of_week = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const target_date = new Date(`${date_param}T00:00:00Z`);
    const day_name = days_of_week[target_date.getUTCDay()];

    // 3. Resolve Pool of Employees to check
    let employees_to_check = [];
    if (employee_id && employee_id !== "null") {
      const selected_employee = await Employee.findById(employee_id);
      if (selected_employee) employees_to_check.push(selected_employee);
    } else {
      // "On-site assignment" fallback: fetch all employees capable of performing this service
      employees_to_check = await Employee.find({
        _id: { $in: service.assigned_employees },
        is_active: true,
      });
    }

    if (employees_to_check.length === 0) {
      return NextResponse.json({
        success: true,
        available_slots: [],
        comments:
          "No active employees assigned to this service/business configuration.",
      });
    }

    // 4. Set Day Boundaries for Booking Queries (UTC)
    const start_of_day = new Date(`${date_param}T00:00:00Z`);
    const end_of_day = new Date(`${date_param}T23:59:59Z`);

    // 5. Fetch all Bookings and Locks for the targeted group of employees for this day
    const employee_ids = employees_to_check.map((emp) => emp._id);

    const [existing_bookings, existing_locks] = await Promise.all([
      Booking.find({
        employee_id: { $in: employee_ids },
        status: { $ne: "cancelled" },
        start_time: { $lt: end_of_day },
        end_time: { $gt: start_of_day },
      }),
      BookingLock.find({
        employee_id: { $in: employee_ids },
        start_time: { $lt: end_of_day },
        end_time: { $gt: start_of_day },
      }),
    ]);

    const final_available_slots = [];

    // 6. Generate time slots across standard operating matrix increments (e.g., 30 mins)
    // Loop through the day in 15 or 30-minute steps starting from the earliest possible shift time
    let timeline_runner = new Date(`${date_param}T00:00:00Z`);
    const timeline_end = new Date(`${date_param}T23:59:59Z`);

    while (timeline_runner < timeline_end) {
      let slot_is_available_for_at_least_one_employee = false;

      for (const employee of employees_to_check) {
        // Find employee shift schedule for this day
        const day_schedule = employee.availability_schedule?.find(
          (sched: any) => sched.day_of_week === day_name && sched.is_working,
        );

        if (!day_schedule) continue; // Employee isn't working today

        // Resolve duration (Check for employee specific override)
        const override = employee.service_overrides?.find(
          (o: any) => o.service_id.toString() === service_id,
        );
        const duration = override?.custom_duration || service.base_duration;

        // Construct shift bounds for this specific slot check
        const shift_start = new Date(
          `${date_param}T${day_schedule.shift_start}:00Z`,
        );
        const shift_end = new Date(
          `${date_param}T${day_schedule.shift_end}:00Z`,
        );
        const slot_end = new Date(timeline_runner.getTime() + duration * 60000);

        // Ensure current timeline runner fits inside employee operational shift window
        if (timeline_runner < shift_start || slot_end > shift_end) {
          continue;
        }

        // Check if employee has a collision in bookings or active locks
        const has_collision = [...existing_bookings, ...existing_locks].some(
          (record) => {
            if (record.employee_id.toString() !== employee._id.toString())
              return false;
            // Overlap calculation math logic
            return (
              timeline_runner < record.end_time && slot_end > record.start_time
            );
          },
        );

        if (!has_collision) {
          slot_is_available_for_at_least_one_employee = true;
          break; // Optimization: Stop checking other employees for this slot time increment
        }
      }

      if (slot_is_available_for_at_least_one_employee) {
        final_available_slots.push(new Date(timeline_runner));
      }

      // Step forward by 30-minute intervals
      timeline_runner = new Date(timeline_runner.getTime() + 30 * 60000);
    }

    return NextResponse.json({
      success: true,
      count: final_available_slots.length,
      available_slots: final_available_slots,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
