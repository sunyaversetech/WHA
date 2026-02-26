"use client";
import {
  LayoutDashboard,
  Users,
  ChevronDown,
  LucideIcon,
  Calendar1,
  HeartHandshake,
  Album,
  User,
  CirclePile,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useState } from "react";

export type NavItem = {
  icon: LucideIcon;
  name: string;
  link?: string;
  hasDropdown: boolean;
  children?: { title: string; link: string; active?: boolean }[];
  active?: boolean;
};

export type NavGroup = {
  groupLabel: string;
  items: NavItem[];
};

const Sidebar = () => {
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);
  const pathname = usePathname();

  const menuData: NavGroup[] = [
    {
      groupLabel: "General",
      items: [
        {
          name: "dashboard",
          icon: LayoutDashboard,
          link: "/dashboard",
          hasDropdown: false,
          active: pathname === "/dashboard",
        },
        {
          name: "booking",
          icon: Album,
          link: "/dashboard/bookings",
          hasDropdown: false,
          active: pathname === "/dashboard/bookings",
        },
        {
          name: "deals",
          icon: HeartHandshake,
          link: "/dashboard/deals",
          hasDropdown: false,
          active: pathname.startsWith("/dashboard/deals"),
        },
        {
          name: "events",
          icon: Calendar1,
          link: "/dashboard/events",
          hasDropdown: false,
          active: pathname.startsWith("/dashboard/events"),
        },
      ],
    },
    {
      groupLabel: "Inventory",
      items: [
        {
          name: "inventory",
          icon: CirclePile,
          link: "/dashboard/inventory",
          hasDropdown: false,
          active: pathname.startsWith("/dashboard/inventory"),
        },
      ],
    },
    {
      groupLabel: "Profile",
      items: [
        {
          name: "profile",
          icon: User,
          link: "/dashboard/profile",
          hasDropdown: false,
          active: pathname.startsWith("/dashboard/profile"),
        },
      ],
    },
  ];

  return (
    <div className="w-20 sm:w-17 min-h-screen bg-black text-white border-r overflow-y-auto flex flex-col p-4 font-sans text-sm overflow-hidden ">
      {menuData.map((group, idx) => (
        <div key={idx} className="">
          <div className="space-y-1 ">
            {group.items.map((item) => {
              return (
                <div key={item.link}>
                  <div
                    className={`relative group  flex items-center rounded-lg mb-2 transition-colors ${item.active ? "bg-slate-100 text-black" : "hover:bg-slate-100 hover:text-black"}`}>
                    <Link
                      title={item.name}
                      aria-label={item.name}
                      href={item.link || "#"}
                      className="flex-1 flex items-center gap-3 p-2 pr-10">
                      <item.icon size={18} strokeWidth={1.5} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
