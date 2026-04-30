"use client";
import {
  LayoutDashboard,
  LucideIcon,
  User,
  HeartPlus,
  Ticket,
  BadgeDollarSign,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { useState } from "react";
import Image from "next/image";

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
  const searchParams = useSearchParams();
  const currentCity = searchParams.get("city");
  const buildPath = (href: string) => {
    if (!currentCity) return href;
    return `${href}?city=${currentCity}`;
  };

  const menuData: NavGroup[] = [
    {
      groupLabel: "General",
      items: [
        {
          name: "dashboard",
          icon: LayoutDashboard,
          link: buildPath("/dashboard"),
          hasDropdown: false,
          active: pathname === "/dashboard",
        },
        // {
        //   name: "booking",
        //   icon: Calendar,
        //   link: buildPath("/dashboard/bookings"),
        //   hasDropdown: false,
        //   active: pathname === "/dashboard/bookings",
        // },
        {
          name: "deals",
          icon: BadgeDollarSign,
          link: buildPath("/dashboard/deals"),
          hasDropdown: false,
          active: pathname.startsWith("/dashboard/deals"),
        },
        {
          name: "events",
          icon: Ticket,
          link: "/dashboard/events",
          hasDropdown: false,
          active: pathname.startsWith("/dashboard/events"),
        },
      ],
    },
    // {
    //   groupLabel: "Inventory",
    //   items: [
    //     {
    //       name: "inventory",
    //       icon: CirclePile,
    //       link: buildPath("/dashboard/inventory"),
    //       hasDropdown: false,
    //       active: pathname.startsWith("/dashboard/inventory"),
    //     },
    //   ],
    // },
    {
      groupLabel: "Profile",
      items: [
        {
          name: "profile",
          icon: User,
          link: buildPath("/dashboard/profile"),
          hasDropdown: false,
          active: pathname.startsWith("/dashboard/profile"),
        },
        {
          name: "Favorites",
          icon: HeartPlus,
          link: buildPath("/dashboard/favorite"),
          hasDropdown: false,
          active: pathname.startsWith("/dashboard/favorite"),
        },
        {
          name: "Settings",
          icon: Settings,
          link: buildPath("/dashboard/settings"),
          hasDropdown: false,
          active: pathname.startsWith("/dashboard/settings"),
        },
      ],
    },
  ];

  return (
    <div
      className="h-screen hidden md:flex
      fixed top-0 left-0  
                  w-20 md:w-56
                  shrink-0
                  bg-primary 
                  text-white 
                  border-r 
                   flex-col 
                  font-sans text-sm 
                  transition-all duration-300">
      <div className="flex-1 overflow-y-auto p-2 md:p-4">
        <Link
          href={buildPath("/")}
          className="flex items-center justify-center ">
          <Image
            src="/wha/logo2.png"
            alt="Whats Happening Australia Logo"
            width={100}
            height={20}
            className="object-contain"
            priority
          />
        </Link>
        {menuData.map((group, idx) => (
          <div key={idx} className="mb-6">
            {/* Optional Group Label (Desktop Only) */}
            <div className="hidden md:block text-xs uppercase text-gray-400 mb-2 px-2">
              {group.groupLabel}
            </div>

            <div className="space-y-1">
              {group.items.map((item) => (
                <div key={item.link}>
                  {/* <Link
                    href={item.link || "#"}
                    title={item.name}
                    className={`flex items-center 
                              justify-center md:justify-start
                              gap-3 
                              p-3 
                              rounded-md
                              transition-all duration-200
                              w-full
                              ${
                                item.active
                                  ? "bg-slate-100 text-black"
                                  : "hover:bg-gray-600 hover:text-white"
                              }`}>
                
                    <item.icon size={22} strokeWidth={1.5} />

   
                    <span className="hidden md:inline capitalize font-medium">
                      {item.name}
                    </span>
                  </Link> */}

                  {/* new design with text  */}
                  <Link
                    href={item.link || "#"}
                    title={item.name}
                    className={`flex flex-col md:flex-row
              items-center 
              justify-center md:justify-start
              gap-1 md:gap-3
              p-2 md:p-3
              rounded-md
              transition-all duration-200
              w-full
              ${
                item.active
                  ? "bg-slate-100 text-black"
                  : "hover:bg-gray-600 hover:text-white"
              }`}>
                    {/* ICON */}
                    <item.icon size={22} strokeWidth={1.5} />

                    {/* TEXT */}
                    <span className="text-[10px] md:text-sm capitalize font-medium">
                      {item.name}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
