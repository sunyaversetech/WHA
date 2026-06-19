import { connectToDb } from "@/lib/db";
import { authOptions } from "../../auth/[...nextauth]/route";
import { getServerSession } from "next-auth";
import User from "@/server/models/Auth.model";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    await connectToDb();
    const body = await req.json();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const updatedAbn = await User.findOneAndUpdate(
      { _id: session.user.id },
      {
        business_type: body.business_type,
      },
      { upsert: true, new: true, runValidators: true },
    );

    return NextResponse.json(
      { data: updatedAbn, message: "Business Type updated successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
