import { connectToDb } from "@/lib/db";
import { EmployeeShiftOverride } from "@/server/models/EmployeeShiftOverride.model";
import { Employee } from "@/server/models/Employee.model";
import { NextResponse } from "next/server";
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
