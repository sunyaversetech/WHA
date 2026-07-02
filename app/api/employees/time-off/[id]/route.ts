import { connectToDb } from "@/lib/db";
import { EmployeeTimeOff } from "@/server/models/EmployeeTimeOff.model";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

type Props = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: Props) {
  try {
    await connectToDb();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: "Invalid time-off ID" },
        { status: 400 },
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
