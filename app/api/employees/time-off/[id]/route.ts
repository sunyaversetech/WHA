import { connectToDb } from "@/lib/db";
import { EmployeeTimeOff } from "@/server/models/EmployeeTimeOff.model";
import { Employee } from "@/server/models/Employee.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type Props = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const business_id = (session.user as any).id;

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
