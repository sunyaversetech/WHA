import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { connectToDb } from "@/lib/db";
import { authOptions } from "../../auth/[...nextauth]/route";
import Service from "@/app/dashboard/inventory/page";
import mongoose from "mongoose";

export async function GET(request: Request) {
  try {
    await connectToDb();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "127.0.0.1";

    let userLat = 27.7172;
    let userLng = 85.324;

    if (ip !== "127.0.0.1" && ip !== "::1") {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}`);
        const geoData = await geoRes.json();
        if (geoData.status === "success") {
          userLat = geoData.lat;
          userLng = geoData.lon;
        }
      } catch (geoError) {
        console.error("Failed to fetch location from IP:", geoError);
      }
    }

    const ServiceModel = mongoose.models.Service || Service;

    const services = await ServiceModel.aggregate([
      {
        $addFields: {
          business_obj_id: { $toObjectId: "$business_id" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "business_obj_id",
          foreignField: "_id",
          as: "business_details",
        },
      },
      { $unwind: "$business_details" },

      // Step D: Distance math: √((lat2 - lat1)² + (lng2 - lng1)²)
      {
        $addFields: {
          distance: {
            $sqrt: {
              $add: [
                {
                  $pow: [
                    { $subtract: ["$business_details.latitude", userLat] },
                    2,
                  ],
                },
                {
                  $pow: [
                    { $subtract: ["$business_details.longitude", userLng] },
                    2,
                  ],
                },
              ],
            },
          },
        },
      },

      { $sort: { distance: 1 } },

      {
        $lookup: {
          from: "employees",
          localField: "assigned_employees",
          foreignField: "_id",
          as: "assigned_employees",
        },
      },

      {
        $project: {
          distance: 1,
          name: 1,
          description: 1,
          category: 1,
          base_price: 1,
          base_duration: 1,
          assigned_employees: 1,
          is_active: 1,
          business_name: "$business_details.business_name",
          business_city: "$business_details.city",
        },
      },
    ]);
    return NextResponse.json(
      {
        success: true,
        user_coords: { lat: userLat, lng: userLng },
        data: services,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
