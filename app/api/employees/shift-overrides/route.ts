import { connectToDb } from "@/lib/db";
import { EmployeeShiftOverride } from "@/server/models/EmployeeShiftOverride.model";
import { Employee } from "@/server/models/Employee.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { z, ZodError } from "zod";
import { requireBusinessUser } from "@/server/lib/businessAuth";

const upsert_schema = z.object({
  employee_id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  is_day_off: z.boolean().optional(),
  shifts: z
    .array(z.object({ start: z.string(), end: z.string() }))
    .optional(),
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
    const week_start = searchParams.get("week_start");
    const week_end = searchParams.get("week_end");

    const query: any = {};
    if (employee_id) {
      if (!mongoose.Types.ObjectId.isValid(employee_id))
        return NextResponse.json(
          { success: false, error: "Invalid employee_id" },
          { status: 400 },
        );
      // Another business's employee → same empty result as an unknown id.
      query.employee_id = own_employee_ids.includes(employee_id) ? employee_id : { $in: [] };
    } else {
      query.employee_id = { $in: own_employee_ids };
    }
    if (week_start) query.date = { ...query.date, $gte: week_start };
    if (week_end) query.date = { ...query.date, $lte: week_end };

    const overrides = await EmployeeShiftOverride.find(query);
    return NextResponse.json({ success: true, data: overrides }, { status: 200 });
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
    const validated = upsert_schema.parse(body);

    const owningEmployee = await Employee.findOne({
      _id: validated.employee_id,
      business_id,
    });
    if (!owningEmployee) {
      return NextResponse.json(
        { success: false, error: "Employee not found" },
        { status: 404 },
      );
    }

    const override = await EmployeeShiftOverride.findOneAndUpdate(
      { employee_id: validated.employee_id, date: validated.date },
      {
        is_day_off: validated.is_day_off ?? false,
        shifts: validated.shifts ?? [],
      },
      { upsert: true, new: true },
    );

    return NextResponse.json({ success: true, data: override }, { status: 200 });
  } catch (error: any) {
    if (error instanceof ZodError)
      return NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; "),
        },
        { status: 422 },
      );
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
