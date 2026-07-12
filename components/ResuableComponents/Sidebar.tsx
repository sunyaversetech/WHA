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
  ChevronLeft,
  Plus,
  MoreHorizontal,
  LucideIcon,
  Smile,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type SubItem = { label: string; href: string; dot?: boolean };
type NavItem = {
  icon: LucideIcon;
  label: string;
  href?: string;
  children?: { section?: string; items: SubItem[] }[];
};

const NAV_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  {
    icon: Calendar,
    label: "Calendar",
    children: [
      {
        items: [
          { label: "Calendar", href: "/dashboard/calendar" },
          { label: "Reservations", href: "/dashboard/reservations" },
        ],
      },
    ],
  },
  { icon: Tag, label: "Deals", href: "/dashboard/deals" },
  { icon: Smile, label: "Clients", href: "/dashboard/clients" },
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
        items: [{ label: "Resources", href: "/dashboard/resources" }],
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

  const openFlyout = flyout ? NAV_ITEMS.find((i) => i.label === flyout) : null;

  return (
    <>
      {/* ── Icon rail ─────────────────────────────────────────────────── */}
      <div
        className="fixed top-0 left-0 h-screen z-40 flex flex-col"
        style={{
          width: 48,
          background: "#0d0f1a",
          borderRight: "1px solid rgba(255,255,255,0.06)",
        }}>
        {/* Logo */}
        <div
          className="flex items-center justify-center shrink-0 cursor-pointer border-b border-white/5"
          style={{ height: 56 }}
          onClick={() => router.push("/")}>
          <Image src="/wha/logo2.png" alt="Logo" width={32} height={32} />
        </div>

        {/* Nav icons */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item);
            const open = flyout === item.label;
            const highlight = active || open;

            return (
              <div key={item.label} className="relative">
                {item.href ? (
                  <Link
                    href={item.href}
                    title={item.label}
                    onClick={() => setFlyout(null)}
                    className="flex items-center justify-center w-full transition-colors relative"
                    style={{
                      height: 48,
                      color: highlight ? "#fff" : "rgba(255,255,255,0.4)",
                    }}>
                    {highlight && (
                      <div
                        className="absolute inset-x-1.5 inset-y-1 rounded-lg"
                        style={{ background: "rgba(124,58,237,0.25)" }}
                      />
                    )}
                    <item.icon
                      size={18}
                      strokeWidth={highlight ? 2 : 1.6}
                      className="relative z-10"
                    />
                  </Link>
                ) : (
                  <button
                    title={item.label}
                    type="button"
                    onClick={() =>
                      setFlyout((prev) =>
                        prev === item.label ? null : item.label,
                      )
                    }
                    className="flex items-center justify-center w-full transition-colors relative"
                    style={{
                      height: 48,
                      color: highlight ? "#fff" : "rgba(255,255,255,0.4)",
                    }}>
                    {highlight && (
                      <div
                        className="absolute inset-x-1.5 inset-y-1 rounded-lg"
                        style={{
                          background: open
                            ? "rgba(124,58,237,0.35)"
                            : "rgba(124,58,237,0.25)",
                        }}
                      />
                    )}
                    <item.icon
                      size={18}
                      strokeWidth={highlight ? 2 : 1.6}
                      className="relative z-10"
                    />
                  </button>
                )}
              </div>
            );
          })}
        </nav>

        {/* Help */}
        <div className="shrink-0 flex justify-center py-2 border-t border-white/5">
          <button
            type="button"
            title="Help"
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            <HelpCircle size={17} strokeWidth={1.6} />
          </button>
        </div>
      </div>

      {/* ── Flyout backdrop ───────────────────────────────────────────── */}
      {flyout && (
        <div className="fixed inset-0 z-38" onClick={() => setFlyout(null)} />
      )}

      {/* ── Flyout panel ─────────────────────────────────────────────── */}
      <div
        className={cn(
          "fixed top-0 h-screen z-39 flex flex-col overflow-hidden transition-all duration-250 ease-in-out",
          flyout ? "w-[200px] md:w-[220px]" : "w-0",
        )}
        style={{
          left: 48,
          background: "#111827",
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}>
        {openFlyout && (
          <>
            {/* Flyout header */}
            <div
              className="flex items-center gap-2 px-3 shrink-0 border-b border-white/6"
              style={{ height: 56 }}>
              <button
                type="button"
                onClick={() => setFlyout(null)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0">
                <ChevronLeft size={16} />
              </button>
              <span className="flex-1 text-sm font-bold text-white truncate">
                {openFlyout.label}
              </span>
              <button
                type="button"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0">
                <MoreHorizontal size={15} />
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors shrink-0">
                <Plus size={15} />
              </button>
            </div>

            {/* Flyout items */}
            <nav className="flex-1 overflow-y-auto py-2">
              {openFlyout.children?.map((group, gi) => (
                <div key={gi} className="mb-1">
                  {group.section && (
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-4 py-1.5">
                      {group.section}
                    </p>
                  )}
                  {group.items.map((sub) => {
                    const subActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href + sub.label}
                        href={sub.href}
                        onClick={() => setFlyout(null)}
                        className={cn(
                          "flex items-center justify-between mx-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                          subActive
                            ? "bg-[#051e3a] text-white"
                            : "text-white/60 hover:text-white hover:bg-white/8",
                        )}>
                        <span>{sub.label}</span>
                        {sub.dot && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </nav>
          </>
        )}
      </div>
    </>
  );
}
