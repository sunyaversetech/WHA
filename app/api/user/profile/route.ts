import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import { NextResponse } from "next/server";
import { getAuthUserDetailed, bearerRejectionResponse } from "@/server/lib/getAuthUser";

export async function GET(req: Request) {
  const authResult = await getAuthUserDetailed(req);
  if (!authResult.user) {
    if (authResult.viaBearer) return bearerRejectionResponse(authResult.reason);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const authUser = authResult.user;

  await connectToDb();
  const user = await User.findOne({ email: authUser.email }).select(
    "-password -token -resetPasswordToken -resetPasswordExpire -verificationTokenExpire",
  );
  return NextResponse.json(user);
}
