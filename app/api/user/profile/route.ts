import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/server/lib/getAuthUser";

export async function GET(req: Request) {
  const authUser = await getAuthUser(req);
  if (!authUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectToDb();
  const user = await User.findOne({ email: authUser.email });
  return NextResponse.json(user);
}
