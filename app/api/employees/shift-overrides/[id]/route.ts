import { connectToDb } from "@/lib/db";
import { EmployeeShiftOverride } from "@/server/models/EmployeeShiftOverride.model";
import { Employee } from "@/server/models/Employee.model";
import { NextResponse } from "next/server";
import { requireBusinessUser } from "@/server/lib/businessAuth";

type Props = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, { params }: Props) {
  try {
    const auth = await requireBusinessUser(request);
    if (!auth.user) return auth.response;
    const business_id = auth.user.id;

    await connectToDb();
    const { id } = await params;

    const existing = await EmployeeShiftOverride.findById(id);
    if (!existing) {
      return NextResponse.json({ success: true }, { status: 200 });
    }
    const owningEmployee = await Employee.findOne({
      _id: existing.employee_id,
      business_id,
    });
    if (!owningEmployee) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 },
      );
    }

    await EmployeeShiftOverride.findByIdAndDelete(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
