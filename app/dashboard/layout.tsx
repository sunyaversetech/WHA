import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import DashboardNavbar from "@/components/Dashboard/DashboardNavbar";
import MobileDashbaord from "@/components/MobileDashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard area",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="hidden md:flex h-screen ml-0 overflow-hidden bg-background ">
        <Sidebar />

        <div className="flex flex-col flex-1 overflow-hidden ml-20 md:ml-56 mt-18  px-10 py-2 md:py-10">
          <main className="flex-1 overflow-y-auto ">{children}</main>
        </div>
      </div>

      <div className="md:hidden h-screen ml-0 overflow-hidden bg-[#f6f6f6] flex ">
        <div className="flex flex-col flex-1 overflow-hidden p-5">
          <main className="flex-1 overflow-y-auto ">{children}</main>
        </div>
      </div>
    </>
  );
}
