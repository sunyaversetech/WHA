import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";
import { NextResponse } from "next/server";

const ALLOWED_ORIGIN = "http://localhost:3001";
const ALLOWED_ORIGIN_PROD = "http://localhost:3001";

const corsHeaders = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET() {
  try {
    await connectToDb();
    const dateNow = new Date().toISOString().split("T")[0];

    const myEvents = await Event.find({
      user: "69c1ba4ad1bc029d8944c864",
    })
      .where("dateRange.from")
      .gte(dateNow as any)
      .sort({
        createdAt: -1,
      });

    return NextResponse.json(
      { data: myEvents, message: "User events retrieved" },
      {
        status: 200,
        headers: corsHeaders,
      },
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      {
        status: 500,
        headers: corsHeaders, // <-- Added CORS headers here so errors don't get blocked either
      },
    );
  }
}
