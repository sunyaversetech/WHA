// app/api/employees/time-off/route.ts
import { connectToDb } from "@/lib/db";
import { EmployeeTimeOff } from "@/server/models/EmployeeTimeOff.model";
import { Employee } from "@/server/models/Employee.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z, ZodError } from "zod";
import { requireBusinessUser } from "@/server/lib/businessAuth";

const create_time_off_schema = z.object({
  employee_id: z.string().min(1),
  type: z.string().optional(),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  repeat: z.boolean().optional(),
  description: z.string().optional(),
  approved: z.boolean().optional(),
  reason: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    await connectToDb();
    const auth = await requireBusinessUser(request);
    if (!auth.user) return auth.response;
    const own_employee_ids = (
      await Employee.find({ business_id: auth.user.id }).select("_id").lean()
    ).map((e) => String(e._id));
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
      // Another business's employee → same empty result as an unknown id.
      query.employee_id = own_employee_ids.includes(employee_id) ? employee_id : { $in: [] };
    } else {
      query.employee_id = { $in: own_employee_ids };
    }

    if (start_date_str && end_date_str) {
      // Time off that overlaps [start, end]: start_time <= end AND end_time >= start
      query.$and = [
        { start_time: { $lte: new Date(end_date_str) } },
        { end_time: { $gte: new Date(start_date_str) } },
      ];
    } else if (start_date_str) {
      query.start_time = { $gte: new Date(start_date_str) };
    } else if (end_date_str) {
      query.end_time = { $lte: new Date(end_date_str) };
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
    const auth = await requireBusinessUser(request);
    if (!auth.user) return auth.response;
    const business_id = auth.user.id;

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

    // Verify employee exists and belongs to the calling business
    const employee = await Employee.findOne({
      _id: validated.employee_id,
      business_id,
    });
    if (!employee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 },
      );
    }

    const time_off = await EmployeeTimeOff.create({
      employee_id: validated.employee_id,
      type: validated.type ?? "Annual leave",
      start_time: start,
      end_time: end,
      repeat: validated.repeat ?? false,
      description: validated.description,
      approved: validated.approved ?? false,
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
