"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  Tag,
  BookOpen,
  Megaphone,
  Users,
  Settings,
  HelpCircle,
  ChevronRight,
  LucideIcon,
  Smile,
} from "lucide-react";
import Image from "next/image";

type SubItem = { label: string; href: string };
type NavItem = {
  icon: LucideIcon;
  label: string;
  href?: string;
  children?: { section?: string; items: SubItem[] }[];
};

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Calendar, label: "Calendar", href: "/dashboard/bookings" },
  { icon: Tag, label: "Deals", href: "/dashboard/deals" },
  { icon: Smile, label: "Clients", href: "/dashboard/employees" },
  {
    icon: BookOpen,
    label: "Catalog",
    children: [
      {
        section: "Services",
        items: [{ label: "Service menu", href: "/dashboard/services" }],
      },
      {
        section: "Inventory",
        items: [{ label: "Products", href: "/dashboard/inventory" }],
      },
    ],
  },
  { icon: Megaphone, label: "Marketing", href: "/dashboard/events" },
  {
    icon: Users,
    label: "Team",
    children: [
      {
        items: [
          { label: "Team members", href: "/dashboard/employees" },
          {
            label: "Scheduled shifts",
            href: "/dashboard/employees/schedule-shift",
          },
        ],
      },
    ],
  },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  useSession();
  const [flyout, setFlyout] = useState<string | null>(null);

  const isActive = (item: NavItem) => {
    if (item.href) {
      return item.href === "/dashboard"
        ? pathname === "/dashboard"
        : pathname.startsWith(item.href);
    }
    return (
      item.children?.some((g) =>
        g.items.some((s) => pathname.startsWith(s.href)),
      ) ?? false
    );
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 h-screen z-40 flex flex-col"
        style={{
          width: 60,
          background: "#0d0f1a",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}>
        <div
          style={{
            height: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}
          onClick={() => router.push("/")}>
          <Image
            src="/wha/logo2.png"
            alt="Whats Happening Australia Logo"
            width={40}
            height={40}
          />
        </div>

        <nav
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "8px 0",
          }}>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const open = flyout === item.label;
            return (
              <div key={item.label} style={{ position: "relative" }}>
                {item.href ? (
                  <Link
                    href={item.href}
                    title={item.label}
                    onClick={() => setFlyout(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 60,
                      height: 52,
                      color: active ? "#fff" : "rgba(255,255,255,0.45)",
                      position: "relative",
                      transition: "color .15s",
                    }}>
                    {active && (
                      <div
                        style={{
                          position: "absolute",
                          left: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 44,
                          height: 38,
                          borderRadius: 10,
                          background: "rgba(124,58,237,0.25)",
                        }}
                      />
                    )}
                    <item.icon
                      size={20}
                      strokeWidth={active ? 2 : 1.6}
                      style={{ position: "relative", zIndex: 1 }}
                    />
                  </Link>
                ) : (
                  <button
                    title={item.label}
                    onClick={() =>
                      setFlyout((prev) =>
                        prev === item.label ? null : item.label,
                      )
                    }
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 60,
                      height: 52,
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: active || open ? "#fff" : "rgba(255,255,255,0.45)",
                      position: "relative",
                      transition: "color .15s",
                    }}>
                    {(active || open) && (
                      <div
                        style={{
                          position: "absolute",
                          left: 8,
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: 44,
                          height: 38,
                          borderRadius: 10,
                          background: open
                            ? "rgba(124,58,237,0.35)"
                            : "rgba(124,58,237,0.25)",
                        }}
                      />
                    )}
                    <item.icon
                      size={20}
                      strokeWidth={active || open ? 2 : 1.6}
                      style={{ position: "relative", zIndex: 1 }}
                    />
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        {/* Help */}
        <div
          style={{
            padding: "8px 0 12px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "center",
          }}>
          <button
            title="Help"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 10,
              border: "none",
              background: "none",
              color: "rgba(255,255,255,0.35)",
              cursor: "pointer",
            }}>
            <HelpCircle size={19} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {/* Flyout panel */}
      {flyout && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setFlyout(null)}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 38,
            }}
          />
          {/* Panel */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 60,
              height: "100vh",
              width: 220,
              background: "#111827",
              borderRight: "1px solid rgba(255,255,255,0.08)",
              zIndex: 39,
              paddingTop: 24,
              overflowY: "auto",
            }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#fff",
                }}>
                {flyout}
              </span>
              <button
                onClick={() => setFlyout(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.4)",
                  cursor: "pointer",
                  padding: 0,
                }}>
                <ChevronRight size={16} />
              </button>
            </div>
            {NAV_ITEMS.find((i) => i.label === flyout)?.children?.map(
              (group, gi) => (
                <div key={gi} style={{ padding: "12px 0" }}>
                  {group.section && (
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "rgba(255,255,255,0.3)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        padding: "0 16px 6px",
                      }}>
                      {group.section}
                    </div>
                  )}
                  {group.items.map((sub) => (
                    <Link
                      key={sub.href + sub.label}
                      href={sub.href}
                      onClick={() => setFlyout(null)}
                      style={{
                        display: "block",
                        padding: "10px 16px",
                        fontSize: 14,
                        fontWeight: 500,
                        color:
                          pathname === sub.href
                            ? "#a78bfa"
                            : "rgba(255,255,255,0.7)",
                        textDecoration: "none",
                        borderRadius: 8,
                        margin: "0 8px",
                        background:
                          pathname === sub.href
                            ? "rgba(124,58,237,0.15)"
                            : "transparent",
                        transition: "background .15s, color .15s",
                      }}>
                      {sub.label}
                    </Link>
                  ))}
                </div>
              ),
            )}
          </div>
        </>
      )}
    </>
  );
}
