"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Calendar, User, Store } from "lucide-react";
import { useSession } from "next-auth/react";

export default function BottomNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Businesses", path: "/businesses", icon: Store },
    { name: "Events", path: "/events", icon: Calendar },
  ];

  return (
    <nav className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm">
      <div
        className="flex items-center justify-between p-2  rounded-full
      bg-white/60 backdrop-blur-2xl
      border border-white/40
      shadow-[0_8px_30px_rgba(0,0,0,0.08)]"
      >
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.path);

          return (
            <Link
              key={link.path}
              href={link.path}
              className="flex-1 flex justify-center"
            >
              <div
                className={`flex items-center justify-center
              w-full h-12 rounded-full 
              transition-all duration-300
              ${
                active
                  ? "bg-primary shadow-md scale-105"
                  : "text-primary hover:text-primary"
              }`}
              >
                <Icon
                  size={22}
                  strokeWidth={2}
                  className={active ? "text-white" : ""}
                />
              </div>
            </Link>
          );
        })}

        {/* Profile / Login */}
        <Link
          href={session ? "/dashboard" : "/auth"}
          className="flex-1 flex justify-center"
        >
          <div
            className={`flex items-center justify-center
          w-full h-12 rounded-full
          transition-all duration-300
          ${
            isActive(session ? "/dashboard" : "/auth")
              ? "bg-primary shadow-md scale-105 text-white"
              : "text-primary hover:text-primary"
          }`}
          >
            <User size={22} strokeWidth={2} />
          </div>
        </Link>
      </div>
    </nav>
  );
}
