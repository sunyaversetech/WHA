"use client";
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCircle,
  ChevronDown,
  LucideIcon,
  WrenchIcon,
  SmilePlus,
  TrendingUp,
  ShoppingCart,
  Calendar1,
  Settings2,
  FileChartLine,
  UserCheck,
  HeartHandshake,
  FileClock,
  GraduationCap,
  PenBox,
  CircleX,
  SquareArrowOutUpRight,
  Megaphone,
  MonitorSmartphone,
  UserStar,
  Receipt,
  Banknote,
  MonitorCheck,
  SquareUser,
  Toolbox,
  UsersRound,
  Handshake,
  HandCoins,
  ParkingMeter,
} from "lucide-react";
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
          title: "Deals",
          icon: LayoutDashboard,
          link: "/domain-workspace",
          hasDropdown: false,
          active: pathname.startsWith("/domain-workspace"),
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
      groupLabel: "Profile",
      items: [
        {
          title: "Contacts",
          icon: Users,
          link: "/crm/contacts",
          hasDropdown: false,
          active: pathname.startsWith("/crm/contacts"),
        },
        {
          title: "Companies",
          icon: Building2,
          link: "/crm/companies",
          hasDropdown: false,
          active: pathname.startsWith("/crm/companies"),
        },

        {
          title: "Deals",
          icon: HeartHandshake,
          link: "/crm/deals",
          hasDropdown: false,
          active: pathname.startsWith("/crm/deals"),
        },
        {
          title: "Leads",
          icon: UserCheck,
          link: "/crm/leads",
          hasDropdown: false,
          active: pathname.startsWith("/crm/leads"),
        },
        {
          title: "Pipeline",
          icon: Settings2,
          link: "/crm/pipeline",
          hasDropdown: false,
          active: pathname.startsWith("/crm/pipeline"),
        },
        {
          title: "Analytics",
          icon: FileChartLine,
          link: "/crm/analytics",
          hasDropdown: false,
          active: pathname.startsWith("/crm/analytics"),
        },
        {
          title: "Activities",
          icon: TrendingUp,
          link: "/crm/activity",
          hasDropdown: false,
          active: pathname.startsWith("/crm/activity"),
        },
      ],
    },
  ];

  const toggleDropdown = (title: string) => {
    setOpenDropdowns((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title],
    );
  };

  return (
    <div className="w-64 h-screen bg-white border-r overflow-y-auto flex flex-col p-4 font-sans text-sm text-slate-600">
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
