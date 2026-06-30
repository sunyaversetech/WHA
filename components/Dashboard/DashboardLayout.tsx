"use client";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Sidebar from "../ResuableComponents/Sidebar";
import UserSidebar from "../ResuableComponents/User-Sidebar";
import {
  Search,
  Bell,
  ChevronRight,
  BarChart2,
  MessageCircle,
} from "lucide-react";

const PROTECTED_PATHS = [
  "/dashboard/bookings",
  "/dashboard/deals",
  "/dashboard/inventory",
  "/dashboard/settings",
  "/dashboard/complete-profile",
];

export default function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.isblocked) router.push("/blocked");
    if (session?.user?.category === "user") {
      const blocked = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
      if (blocked) router.push("/unauthorized");
    }
  }, [pathname, session, router]);

  const isBusiness = session?.user?.category === "business";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f3f4f6" }}>
      {/* Sidebar — stays dark */}
      <div className="hidden md:block">
        {isBusiness ? <Sidebar /> : <UserSidebar />}
      </div>

      {/* Main area */}
      <div className="flex flex-col flex-1 min-h-screen">
        <div className="hidden md:block" style={{ marginLeft: 60 }}>
          {isBusiness && (
            <header
              style={{
                height: 60,
                background: "#ffffff",
                borderBottom: "1px solid #e5e7eb",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                position: "sticky",
                top: 0,
                zIndex: 30,
              }}>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 9999,
                  padding: "8px 16px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: "-0.1px",
                }}>
                <Bell size={14} />
                Continue setup
                <ChevronRight size={14} />
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <IconBtn icon={<Search size={18} />} />
                <IconBtn icon={<BarChart2 size={18} />} />
                <div style={{ position: "relative" }}>
                  <IconBtn icon={<Bell size={18} />} />
                  <span
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "#ef4444",
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #fff",
                    }}>
                    3
                  </span>
                </div>
                <IconBtn icon={<MessageCircle size={18} />} />
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,#7c3aed,#4f46e5)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Sign out">
                  {(session?.user?.name ?? session?.user?.business_name ?? "U")
                    .slice(0, 2)
                    .toUpperCase()}
                </button>
              </div>
            </header>
          )}

          <main style={{ padding: "32px", minHeight: "calc(100vh - 60px)" }}>
            {children}
          </main>
        </div>

        <div
          className="md:hidden flex flex-col flex-1 bg-white"
          style={{ padding: 20 }}>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ icon }: { icon: React.ReactNode }) {
  return (
    <button
      style={{
        width: 36,
        height: 36,
        borderRadius: 9999,
        border: "none",
        background: "#f3f4f6",
        color: "#6b7280",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        transition: "background .15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#e5e7eb")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#f3f4f6")}>
      {icon}
    </button>
  );
}
