import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectToDb();
    const body = await req.json();
    const { sponser, id } = body;
    const newSponsor = await User.findOneAndUpdate(
      { _id: id },
      { sponser: sponser },
      { upsert: true, new: true, runValidators: true },
    );
    return NextResponse.json(
      { data: newSponsor, message: "Sponsor Updated successfully" },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
