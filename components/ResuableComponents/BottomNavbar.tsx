"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  Search,
  Calendar,
  User,
  Store,
  Handshake,
  Heart,
  CalendarDays,
  Tag,
  Building2,
} from "lucide-react";
import { useSession } from "next-auth/react";

export default function BottomNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCity = searchParams.get("city");

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  const buildPath = (href: string) => {
    if (!currentCity) return href;
    return `${href}?city=${currentCity}`;
  };

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Events", path: "/events", icon: CalendarDays },
    { name: "Deals", path: "/deals", icon: Tag },
    { name: "Businesses", path: "/businesses", icon: Building2 },
    {
      name: "Profile",
      path: session ? "/dashboard" : "/auth",
      icon: User,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 z-49 w-full">
      <div
        className="flex items-center justify-between
      bg-white/60 backdrop-blur-2xl
      border border-white/40
      shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
      >
        {navLinks.map((link) => {
          const Icon = link.icon;

          const basePath = link.path;
          const fullPath = buildPath(basePath);
          const active = isActive(basePath);

          return (
            <Link
              key={link.name}
              href={fullPath}
              className="flex-1 flex justify-center"
            >
              <div
                className={`flex flex-col items-center justify-center
      w-full h-14 border-t-2
      transition-colors duration-150
      ${
        active
          ? "text-wha-secondary border-wha-secondary"
          : "text-wha-primary border-transparent"
      }`}
              >
                <Icon size={22} strokeWidth={2} />
                <span className="text-[10px] font-bold pt-1">{link.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
