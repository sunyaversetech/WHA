import { connectToDb } from "@/lib/db";
import { EmployeeTimeOff } from "@/server/models/EmployeeTimeOff.model";
import { Employee } from "@/server/models/Employee.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireBusinessUser } from "@/server/lib/businessAuth";

type Props = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Props) {
  try {
    const auth = await requireBusinessUser(request);
    if (!auth.user) return auth.response;
    const business_id = auth.user.id;

    await connectToDb();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid time-off ID" },
        { status: 400 },
      );
    }

    const existing = await EmployeeTimeOff.findById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Time-off record not found" },
        { status: 404 },
      );
    }
    const owningEmployee = await Employee.findOne({
      _id: existing.employee_id,
      business_id,
    });
    if (!owningEmployee) {
      return NextResponse.json(
        { success: false, error: "Time-off record not found" },
        { status: 404 },
      );
    }

    const deleted = await EmployeeTimeOff.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Time-off record not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Time-off deleted" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
