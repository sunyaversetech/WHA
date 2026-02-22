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
  title: string;
  icon: LucideIcon;
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
          title: "Dashboard",
          icon: LayoutDashboard,
          link: "/dashboard",
          hasDropdown: false,
          active: pathname === "/dashboard",
        },
        {
          title: "Bookings",
          icon: Album,
          link: "/dashboard/bookings",
          hasDropdown: false,
          active: pathname === "/dashboard/bookings",
        },
        {
          title: "Deals",
          icon: HeartHandshake,
          link: "/dashboard/deals",
          hasDropdown: false,
          active: pathname.startsWith("/dashboard/deals"),
        },
        {
          title: "Events",
          icon: Calendar1,
          link: "/events",
          hasDropdown: false,
          active: pathname.startsWith("/events"),
        },
      ],
    },
    {
      groupLabel: "Inventory",
      items: [
        {
          title: "Inventory",
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
          title: "Profile",
          icon: User,
          link: "/dashboard/profile",
          hasDropdown: false,
          active: pathname.startsWith("/dashboard/profile"),
        },
      ],
    },
  ];

  const toggleDropdown = (title: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };
  const { data: session, status } = useSession();

  return (
    <div className="w-64 h-screen bg-white border-r overflow-y-auto flex flex-col p-4 font-sans text-sm text-slate-600">
      <h1 className="text-lg xl:text-2xl md:text-xl mb-10">
        {session?.user.business_name ?? session?.user.name}
      </h1>
      {menuData.map((group, idx) => (
        <div key={idx} className="mb-6">
          <p className="text-[11px] font-bold text-slate-400 mb-4 tracking-wider uppercase">
            {group.groupLabel}
          </p>

          <div className="space-y-1">
            {group.items.map((item) => {
              const isOpen = openDropdowns.includes(item.title);

              return (
                <div key={item.title}>
                  <button
                    onClick={() =>
                      item.hasDropdown && toggleDropdown(item.title)
                    }
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${item.active && "bg-slate-100"} hover:bg-slate-100 ${
                      !item.hasDropdown ? "cursor-pointer" : "cursor-default"
                    }`}>
                    <div className="flex items-center gap-3">
                      <item.icon size={18} strokeWidth={1.5} />
                      <Link
                        href={item.link ? item.link : ""}
                        className="font-medium ">
                        {item.title}
                      </Link>
                      {item.title === "Dashboard" && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                          Hot
                        </span>
                      )}
                    </div>
                    {item.hasDropdown && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </button>

                  {item.hasDropdown && isOpen && (
                    <div className="ml-9 mt-1 space-y-1">
                      {item.children?.map((child) => (
                        <Link
                          key={child.title}
                          href={child.link}
                          className={`block p-2  border-l-2 ${child.active ? "border-l-orange-500 text-orange-500" : "text-slate-500"} hover:text-blue-600 transition-colors`}>
                          {child.title}
                        </Link>
                      ))}
                    </div>
                  )}
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
