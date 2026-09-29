import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.category !== "super-admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDb();
    const body = await req.json();
    const { sponser, id } = body;
    const newSponsor = await User.findByIdAndUpdate(
      id,
      { isSponsor: sponser },
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
