import { connectToDb } from "@/lib/db";
import { EmployeeShiftOverride } from "@/server/models/EmployeeShiftOverride.model";
import { NextResponse } from "next/server";

type Props = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Props) {
  try {
    await connectToDb();
    const { id } = await params;
    await EmployeeShiftOverride.findByIdAndDelete(id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
