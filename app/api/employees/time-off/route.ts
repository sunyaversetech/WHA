// app/api/employees/time-off/route.ts
import { connectToDb } from "@/lib/db";
import { EmployeeTimeOff } from "@/server/models/EmployeeTimeOff.model";
import { Employee } from "@/server/models/Employee.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z, ZodError } from "zod";

const create_time_off_schema = z.object({
  employee_id: z.string().min(1),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  reason: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    await connectToDb();
    const { searchParams } = new URL(request.url);
    const employee_id = searchParams.get("employee_id");
    const start_date_str = searchParams.get("start_date");
    const end_date_str = searchParams.get("end_date");

    const query: any = {};
    if (employee_id) {
      if (!mongoose.Types.ObjectId.isValid(employee_id)) {
        return NextResponse.json(
          { success: false, error: "Invalid employee_id format" },
          { status: 400 },
        );
      }
      query.employee_id = employee_id;
    }

    if (start_date_str || end_date_str) {
      query.start_time = {};
      if (start_date_str) {
        query.start_time.$gte = new Date(start_date_str);
      }
      if (end_date_str) {
        query.end_time = { $lte: new Date(end_date_str) };
      }
    }

    const time_offs = await EmployeeTimeOff.find(query).sort({ start_time: 1 });
    return NextResponse.json(
      { success: true, data: time_offs },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDb();
    const body = await request.json();
    const validated = create_time_off_schema.parse(body);

    const start = new Date(validated.start_time);
    const end = new Date(validated.end_time);

    if (start >= end) {
      return NextResponse.json(
        { success: false, error: "start_time must be before end_time" },
        { status: 400 },
      );
    }

    // Verify employee exists
    const employee = await Employee.findById(validated.employee_id);
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 },
      );
    }

    const time_off = await EmployeeTimeOff.create({
      employee_id: validated.employee_id,
      start_time: start,
      end_time: end,
      reason: validated.reason,
    });

    return NextResponse.json(
      { success: true, data: time_off },
      { status: 201 },
    );
  } catch (error: any) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join("; "),
        },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
