"use client";
import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import ProfileAvatar from "./ProfilePic";
import MobileDashbaord from "./MobileDashboard";
import { useRouter } from "next/navigation";
import { useGetDashboardData } from "@/services/dashboard.service";
import { formatDate } from "date-fns";
import Link from "next/link";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const { data } = useGetDashboardData();
  const router = useRouter();
  const [analyticsData] = React.useState(() =>
    ["Marketing", "Sales", "Support"].map(() =>
      Math.floor(Math.random() * 100),
    ),
  );

  const businessName = (session?.user as { business_name?: string })
    ?.business_name;
  const isUserOnly = !businessName;

  useEffect(() => {
    if (session?.user?.category === "super-admin") {
      router.push("/super-admin");
    }
  }, [session]);

  if (status === "loading")
    return <div className="p-10 text-center">Loading...</div>;
  if (status === "unauthenticated")
    return (
      <p className="p-10 text-center text-red-500">
        Access Denied. Please Login.
      </p>
    );

  return (
    <>
      <div className="hidden md:block ">
        <div className="space-y-6 max-w-6xl mx-auto ">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <ProfileAvatar currentImage={session?.user?.image || ""} />
                </div>

                <div className="flex-1">
                  <div className="flex  flex-col sm:flex-row sm:items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-800">
                      {session?.user?.business_name}
                    </h1>

                    <div className="flex flex-wrap gap-2 mt-1 sm:mt-0">
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase tracking-tighter">
                        {session?.user?.category || "Personal Account"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase tracking-tighter">
                        {session?.user?.verified
                          ? "Verified"
                          : "Business Not Verified"}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mt-2">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
            </header>
          </div>
          {session?.user.category === "user" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 pt-6 px-6">
                  Favorite
                </h2>

                <div>
                  {data?.data?.favorite?.map((item: any) => (
                    <div
                      className="flex items-center justify-between p-6 border-b cursor-pointer hover:bg-gray-50 transition"
                      key={item._id}>
                      <div>
                        <p className="font-medium text-gray-800">
                          {item.item_id.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatDate(
                            item.item_id.dateRange.from,
                            "yyyy-MM-dd",
                          )}{" "}
                          to{" "}
                          {formatDate(item.item_id.dateRange.to, "yyyy-MM-dd")}
                        </p>
                      </div>
                      <Link
                        href={"/dashboard/favorite"}
                        className="text-sm text-blue-600 font-medium">
                        View
                      </Link>
                    </div>
                  ))}

                  {/* <div className="flex items-center justify-between p-6 border-b cursor-pointer hover:bg-gray-50 transition">
                    <div>
                      <p className="font-medium text-gray-800">
                        Product Launch
                      </p>
                      <p className="text-sm text-gray-500">June 18 • 3:00 PM</p>
                    </div>
                    <span className="text-sm text-blue-600 font-medium">
                      View
                    </span>
                  </div> */}
                </div>
              </div>

              {/* Card 2 - Deals */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 pt-6 px-6">
                  Left to Redeem Deals
                </h2>

                <div>
                  <div className="flex items-center justify-between p-6 border-b cursor-pointer hover:bg-gray-50 transition">
                    <div>
                      <p className="font-medium text-gray-800">Acme Corp</p>
                      <p className="text-sm text-gray-500">
                        $12,000 • Closed Won
                      </p>
                    </div>
                    <span className="text-sm text-green-600 font-medium">
                      View
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-6 border-b cursor-pointer hover:bg-gray-50 transition">
                    <div>
                      <p className="font-medium text-gray-800">BrightTech</p>
                      <p className="text-sm text-gray-500">
                        $8,500 • Negotiation
                      </p>
                    </div>
                    <span className="text-sm text-green-600 font-medium">
                      View
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 pt-6 px-6">
                Upcoming Events
              </h2>

              <div>
                <div className="flex items-center justify-between p-6 border-b cursor-pointer hover:bg-gray-50 transition">
                  <div>
                    <p className="font-medium text-gray-800">Design Meetup</p>
                    <p className="text-sm text-gray-500">June 12 • 6:00 PM</p>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">
                    View
                  </span>
                </div>

                <div className="flex items-center justify-between p-6 border-b cursor-pointer hover:bg-gray-50 transition">
                  <div>
                    <p className="font-medium text-gray-800">Product Launch</p>
                    <p className="text-sm text-gray-500">June 18 • 3:00 PM</p>
                  </div>
                  <span className="text-sm text-blue-600 font-medium">
                    View
                  </span>
                </div>
              </div>
            </div>

            {/* Card 2 - Deals */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 pt-6 px-6">
                Recent Deals
              </h2>

              <div>
                <div className="flex items-center justify-between p-6 border-b cursor-pointer hover:bg-gray-50 transition">
                  <div>
                    <p className="font-medium text-gray-800">Acme Corp</p>
                    <p className="text-sm text-gray-500">
                      $12,000 • Closed Won
                    </p>
                  </div>
                  <span className="text-sm text-green-600 font-medium">
                    View
                  </span>
                </div>

                <div className="flex items-center justify-between p-6 border-b cursor-pointer hover:bg-gray-50 transition">
                  <div>
                    <p className="font-medium text-gray-800">BrightTech</p>
                    <p className="text-sm text-gray-500">
                      $8,500 • Negotiation
                    </p>
                  </div>
                  <span className="text-sm text-green-600 font-medium">
                    View
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="md:hidden">
        <MobileDashbaord />
      </div>
    </>
  );
}
