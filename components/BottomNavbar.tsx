"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Tag, Store, User } from "lucide-react";
import { useSession } from "next-auth/react";

export default function BottomNav() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  const navLinks = [
    { name: "Home", path: "/", icon: Home },
    { name: "Events", path: "/events", icon: Calendar },
    { name: "Deals", path: "/deals", icon: Tag },
    { name: "Businesses", path: "/businesses", icon: Store },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-neutral/30 z-50 shadow-lg backdrop-blur-md">
      <div className="flex justify-around items-center h-16">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.path);

          return (
            <Link
              key={link.path}
              href={link.path}
              className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 group ${
                active ? "text-secondary" : "text-black hover:text-secondary"
              }`}
            >
              <div
                className={`flex items-center justify-center rounded-xl p-2 mb-1 transition-all duration-200 ${
                  active
                    ? "bg-red-500 text-sm shadow-md scale-110"
                    : "group-hover:bg-neutral/50 "
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    active
                      ? "text-base"
                      : "text-primary group-hover:text-red-500"
                  }`}
                />
              </div>
              <span
                className={`text-xs font-medium transition-colors duration-200 ${
                  active ? "text-primary" : "text-black hover:text-red-500"
                }`}
              >
                {link.name}
              </span>
            </Link>
          );
        })}

        {/* Dynamic Profile/Login */}
        <Link
          href={session ? "/dashboard" : "/auth"}
          className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 group ${
            isActive(session ? "/dashboard" : "/auth")
              ? "text-secondary"
              : "text-black hover:text-secondary"
          }`}
        >
          <div
            className={`flex items-center justify-center rounded-xl p-2 mb-1 transition-all duration-200 ${
              isActive(session ? "/dashboard" : "/auth")
                ? "bg-red-500 text-sm shadow-md scale-110"
                : "group-hover:bg-neutral/50 "
            }`}
          >
            <User
              className={`h-5 w-5 ${
                isActive(session ? "/dashboard" : "/auth")
                  ? "text-base"
                  : "text-primary group-hover:text-red-500"
              }`}
            />
          </div>
          <span
            className={`text-xs font-medium transition-colors duration-200 ${
              isActive(session ? "/dashboard" : "/auth")
                ? "text-primary"
                : "text-black hover:text-red-500"
            }`}
          >
            {session ? "Profile" : "Login"}
          </span>
        </Link>
      </div>
    </nav>
  );
}
