"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  CalendarDays,
  Tag,
  Building2,
  Calendar,
  User,
} from "lucide-react";
import { useSession } from "next-auth/react";

const NAV_LINKS = (isLoggedIn: boolean) => [
  { name: "Home",       path: "/",           icon: Home },
  { name: "Events",     path: "/events",     icon: CalendarDays },
  { name: "Deals",      path: "/deals",      icon: Tag },
  { name: "Businesses", path: "/businesses", icon: Building2 },
  { name: "Bookings",   path: "/bookings",   icon: Calendar },
  { name: "Profile",    path: isLoggedIn ? "/dashboard" : "/auth", icon: User },
];

export default function BottomNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCity = searchParams.get("city");

  const buildPath = (href: string) =>
    currentCity ? `${href}?city=${currentCity}` : href;

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  const links = NAV_LINKS(!!session);

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50
                 bg-white/90 backdrop-blur-xl
                 border-t border-border
                 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
      <div className="flex items-stretch">
        {links.map(({ name, path, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={name}
              href={buildPath(path)}
              aria-label={name}
              aria-current={active ? "page" : undefined}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5
                         min-h-[56px] touch-manipulation
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary">
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 1.8}
                className={`transition-colors duration-150 ${
                  active ? "text-secondary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[9px] font-bold tracking-tight transition-colors duration-150 ${
                  active ? "text-secondary" : "text-muted-foreground"
                }`}>
                {name}
              </span>
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-[2px] bg-secondary rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
