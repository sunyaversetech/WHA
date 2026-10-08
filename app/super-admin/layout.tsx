import SuperAdminLayoutContent from "@/components/SuperAdmin/SuperAdminLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Super Admin",
  description: "Platform administration",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SuperAdminLayoutContent>{children}</SuperAdminLayoutContent>;
}
