"use client";
import React from "react";
import { useSession, signOut } from "next-auth/react";
import {
  ChevronLeft,
  Plus,
  Calendar,
  Briefcase,
  Ticket,
  Users,
  TrendingUp,
  CheckSquare,
  DollarSign,
  LogOut,
  Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [analyticsData] = React.useState(() =>
    ["Marketing", "Sales", "Support"].map(() =>
      Math.floor(Math.random() * 100),
    ),
  );

  console.log("Session Data:", session);

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
    <div className="p-8 min-h-screen space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden text-orange-600 font-bold">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border cursor-pointer hover:bg-slate-50">
              <Edit3 className="h-3 w-3 text-slate-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 ">
              <h1 className="text-xl font-bold text-slate-800">
                Welcome Back, {session?.user?.name}
              </h1>
              <div className="sm:hidden md:flex md:flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-tighter">
                  {businessName || "Personal Account"}
                </Badge>
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
            <p className="text-sm text-slate-500">
              {session?.user?.email} •{" "}
              <span className="text-orange-500 font-semibold underline">
                21
              </span>{" "}
              Pending Approvals
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button className="bg-[#437682] hover:bg-[#365f69] text-white gap-2 shadow-lg">
            <Plus className="h-4 w-4" /> Add Events
          </Button>
          <Button className="bg-[#f27431] hover:bg-[#d96328] text-white gap-2 shadow-lg">
            <Plus className="h-4 w-4" /> Add Deals
          </Button>
          <Button
            variant="outline"
            onClick={() => signOut()}
            className="border-red-200 text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Attendance Overview"
          value="120/154"
          trend="+2.1%"
          icon={<Calendar />}
          iconBg="bg-orange-500"
        />

        {/* If category is user: Events | Else: Properties */}
        <MetricCard
          title={isUserOnly ? "Total Events" : "Total No of Properties"}
          value={isUserOnly ? "45" : "90/125"}
          trend="-2.1%"
          trendDown
          icon={<Briefcase />}
          iconBg="bg-teal-600"
        />

        {/* If category is user: Active Events | Else: Clients */}
        <MetricCard
          title={isUserOnly ? "Active Events" : "Total No of Clients"}
          value={isUserOnly ? "12" : "69/86"}
          trend="-11.2%"
          trendDown
          icon={<Users />}
          iconBg="bg-blue-500"
        />

        {/* If category is user: Past Bookings | Else: Tasks */}
        <MetricCard
          title={isUserOnly ? "Past Bookings" : "Total No of Tasks"}
          value={isUserOnly ? "168" : "225/28"}
          trend="+11.2%"
          icon={<CheckSquare />}
          iconBg="bg-pink-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <MetricCard
            title="Earnings"
            value="$21,445"
            trend="+10.2%"
            icon={<DollarSign />}
            iconBg="bg-purple-500"
          />
          <MetricCard
            title="Profit This Week"
            value="$5,544"
            trend="+2.1%"
            icon={<TrendingUp />}
            iconBg="bg-red-500"
          />
          <MetricCard
            title="Tenant Applicant"
            value="98"
            trend="+2.1%"
            icon={<Users />}
            iconBg="bg-emerald-500"
          />
          <MetricCard
            title="New Tenant"
            value="45/48"
            trend="-11.2%"
            trendDown
            icon={<Users />}
            iconBg="bg-slate-800"
          />
        </div>

        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-md font-bold text-slate-700">
              Analytics
            </CardTitle>
            <Badge variant="outline">This Week</Badge>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {["Marketing", "Sales", "Support"].map((item, index) => (
              <div key={item} className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>{item}</span>
                  <span>{analyticsData[index]}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: "60%" }}
                  />
                </div>
              </div>
            ))}
            <p className="text-[11px] text-slate-400 text-center mt-4">
              Stats automatically updated based on{" "}
              {isUserOnly ? "personal" : "business"} activity.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Sub-component for the Metric Cards
const MetricCard = ({
  title,
  value,
  trend,
  icon,
  iconBg,
  trendDown = false,
}: any) => (
  <Card className="border-none shadow-sm hover:shadow-md transition-all">
    <CardContent className="p-6">
      <div className="flex justify-between items-start">
        <div
          className={`h-10 w-10 ${iconBg} rounded-lg flex items-center justify-center text-white shadow-lg shadow-black/10`}>
          {React.cloneElement(icon, { size: 18 })}
        </div>
        <ChevronLeft className="h-7 w-7 rounded-full border p-1.5 shadow-[0_4px_10px_rgba(0,0,0,0.2)] bg-white text-slate-400 rotate-180" />
      </div>
      <div className="mt-5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          {title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
            {value}
          </h3>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${trendDown ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"}`}>
            {trendDown ? "▼" : "▲"} {trend}
          </span>
        </div>
        <button className="text-[10px] font-bold text-slate-400 mt-4 hover:text-orange-500 transition-colors uppercase tracking-tighter">
          View Details
        </button>
      </div>
    </CardContent>
  </Card>
);
