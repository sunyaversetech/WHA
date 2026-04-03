"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, Search, Calendar, User, Store, Handshake } from "lucide-react";
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
    { name: "Home", path: buildPath("/"), icon: Home },
    { name: "Businesses", path: buildPath("/businesses"), icon: Store },
    { name: "Events", path: buildPath("/events"), icon: Calendar },
    { name: "Deals", path: buildPath("/deals"), icon: Handshake },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 z-[99] w-full">
      <div
        className="flex items-center justify-between p-2  
      bg-white/60 backdrop-blur-2xl
      border border-white/40
      shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.path);

          return (
            <Link
              key={link.path}
              href={link.path}
              className="flex-1 flex justify-center">
              <div
                className={`flex flex-col items-center justify-center
              w-full h-12 rounded-full 
              transition-all duration-300
              ${
                active
                  ? "bg-primary shadow-md scale-105"
                  : "text-primary hover:text-primary"
              }`}>
                <Icon
                  size={22}
                  strokeWidth={2}
                  className={active ? "text-white" : ""}
                />
                <span
                  className={`text-[10px] font-medium  ${
                    active ? "text-white" : "text-primary"
                  }`}>
                  {link.name}
                </span>
              </div>
            </Link>
          );
        })}

        {/* Profile / Login */}
        <Link
          href={session ? buildPath("/dashboard") : buildPath("/auth")}
          className="flex-1 flex justify-center">
          <div
            className={`flex flex-col items-center justify-center
          w-full h-12 rounded-full
          transition-all duration-300
          ${
            isActive(session ? "/dashboard" : "/auth")
              ? "bg-primary shadow-md scale-105 text-white"
              : "text-primary hover:text-primary"
          }`}>
            <User size={22} strokeWidth={2} />
            <span className="text-[10px] font-medium">Profile</span>
          </div>
        </Link>
      </div>
    </nav>
  );
}
