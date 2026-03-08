"use client";
import React from "react";
import { useSession, signOut } from "next-auth/react";
import {
  ChevronLeft,
  Plus,
  Briefcase,
  Users,
  CheckSquare,
  LogOut,
  Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProfileAvatar from "./ProfilePic";
import DashboardNavbar from "./Dashboard/DashboardNavbar";
import MobileDashbaord from "./MobileDashboard";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [analyticsData] = React.useState(() =>
    ["Marketing", "Sales", "Support"].map(() =>
      Math.floor(Math.random() * 100),
    ),
  );

  const businessName = (session?.user as { business_name?: string })
    ?.business_name;
  const isUserOnly = !businessName;

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
            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                {/* Profile Avatar */}
                <div className="relative">
                  <ProfileAvatar currentImage={session?.user?.image || ""} />
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex  flex-col sm:flex-row sm:items-center gap-2">
                    <h1 className="text-xl font-bold text-slate-800">
                      {session?.user?.business_name}
                    </h1>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mt-1 sm:mt-0">
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase tracking-tighter"
                      >
                        {session?.user?.category || "Personal Account"}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase tracking-tighter"
                      >
                        {session?.user?.verified
                          ? "Verified"
                          : "Business Not Verified"}
                      </Badge>
                    </div>
                  </div>

                  {/* Email */}
                  <p className="text-sm text-slate-500 mt-2">
                    {session?.user?.email}
                    {/* Optional pending approvals */}
                    {/* • <span className="text-orange-500 font-semibold underline">21</span> Pending Approvals */}
                  </p>
                </div>
              </div>
            </header>
          </div>

          {/* card  */}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card 1 - Upcoming Events */}
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
