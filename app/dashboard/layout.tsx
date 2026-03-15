import DashboardLayoutContent from "@/components/Dashboard/DashboardLayout";
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
  return <DashboardLayoutContent>{children}</DashboardLayoutContent>;
}
