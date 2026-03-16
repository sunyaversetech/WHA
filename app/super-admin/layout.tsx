import DashboardLayoutContent from "@/components/Dashboard/DashboardLayout";
import SuperAdminLayoutContent from "@/components/SuperAdmin/SuperAdminLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard area",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperAdminLayoutContent>{children}</SuperAdminLayoutContent>;
}
