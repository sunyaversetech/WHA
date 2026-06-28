import { connectToDb } from "@/lib/db";
import User from "@/server/models/Auth.model";
import Event from "@/server/models/Event.model";
import { NextResponse } from "next/server";

/**
 * One-time migration: populates the `geo` GeoJSON field from existing
 * `latitude` / `longitude` values on all User (business) and Event documents.
 *
 * Hit once: GET /api/migrate-geo
 * Safe to re-run — skips documents that already have `geo`.
 */
export async function GET() {
  try {
    await connectToDb();

    // Businesses (category = "business") that have lat/lng but no geo field
    const businessResult = await User.updateMany(
      {
        category: "business",
        latitude: { $exists: true, $ne: null },
        longitude: { $exists: true, $ne: null },
        geo: { $exists: false },
      },
      [
        {
          $set: {
            geo: {
              type: "Point",
              // GeoJSON coordinates are [longitude, latitude]
              coordinates: ["$longitude", "$latitude"],
            },
          },
        },
      ],
    );

    // Events that have lat/lng but no geo field
    const eventResult = await Event.updateMany(
      {
        latitude: { $exists: true, $ne: null },
        longitude: { $exists: true, $ne: null },
        geo: { $exists: false },
      },
      [
        {
          $set: {
            geo: {
              type: "Point",
              coordinates: ["$longitude", "$latitude"],
            },
          },
        },
      ],
    );

    return NextResponse.json(
      {
        message: "Migration complete",
        businesses: {
          matched: businessResult.matchedCount,
          updated: businessResult.modifiedCount,
        },
        events: {
          matched: eventResult.matchedCount,
          updated: eventResult.modifiedCount,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
