"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { LogoutDialog } from "../ui/LogoutDialog";

import EventSearchWithDates from "./SearchSectionForEvents";
import BusinessSearchWithDates from "./SearchSectionforBusiness";
import DealsSearchWithDates from "./SearchSectionForDeals";
import MobileEventSearchWithDates from "./MobileViewSearch/SearchSectionForEvents";
import MobileBusinessSearchWithDates from "./MobileViewSearch/SearchSectionforBusiness";
import MobileDealsSearchWithDates from "./MobileViewSearch/SearchSectionForDeals";

const navItems = [
  { id: "event",    label: "Events",     href: "/events",     img: "/navbar/calendar.png",           activeImg: "/navbar/calendar.gif" },
  { id: "deals",    label: "Deals",      href: "/deals",      img: "/navbar/agreement.png",          activeImg: "/navbar/agreement.gif" },
  { id: "business", label: "Businesses", href: "/businesses", img: "/navbar/corporate-culture.png",  activeImg: "/navbar/corporate-culture.gif" },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCity = searchParams.get("city");

  const getActiveTab = () => {
    if (pathname.startsWith("/events"))     return "event";
    if (pathname.startsWith("/deals"))      return "deals";
    if (pathname.startsWith("/businesses")) return "business";
    return "";
  };

  const [activeTab, setActiveTab] = useState(getActiveTab);

  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [pathname]);

  useEffect(() => {
    const savedCity = localStorage.getItem("preferredCity");
    if (savedCity && !currentCity) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("city", savedCity);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [currentCity, pathname, router, searchParams]);

  const buildPath = (href: string) => {
    if (!currentCity) return href;
    return `${href}?city=${currentCity}`;
  };

  const path = pathname.split("?")[0];
  const isEventsPage   = path === "/events";
  const isDealsPage    = path === "/deals";
  const isBusinessPage = path === "/businesses";
  const isDashboard    = path.startsWith("/dashboard");
  const showMobileSearch = isEventsPage || isDealsPage || isBusinessPage;

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="md:hidden fixed top-0 left-0 w-full z-50 bg-white shadow-sm">
        {/* Logo row – always shown on mobile */}
        {!showMobileSearch && (
          <div className="flex items-center justify-between px-4 py-3">
            <Link href={buildPath("/")} aria-label="Home">
              <Image
                src="/wha/logo.png"
                alt="What's Happening Australia"
                width={90}
                height={24}
                className="object-contain h-auto"
                priority
              />
            </Link>
            <div className="flex items-center gap-2">
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label="Account menu">
                      <Avatar className="h-9 w-9 border-2 border-border">
                        <AvatarImage className="object-cover" src={session?.user?.image ?? ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                          {session?.user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-3 rounded-2xl shadow-xl">
                    <p className="font-semibold text-sm">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground mb-2 truncate">{session.user?.email}</p>
                    <div className="border-t border-border my-2" />
                    <Link href={buildPath("/dashboard")} className="block px-2 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
                      Dashboard
                    </Link>
                    <LogoutDialog />
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href={buildPath("/auth")}>
                  <Button size="sm" className="rounded-full px-4 text-xs font-semibold">Login</Button>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Search row – shown on listing pages */}
        {showMobileSearch && (
          <>
            {isEventsPage   && <MobileEventSearchWithDates />}
            {isDealsPage    && <MobileDealsSearchWithDates />}
            {isBusinessPage && <MobileBusinessSearchWithDates />}
          </>
        )}
      </div>

      {/* ── Desktop nav ── */}
      {!isDashboard && (
        <nav className="hidden md:block fixed top-0 left-0 z-50 w-full bg-white/95 backdrop-blur-md shadow-sm">
          <div className="flex items-center justify-between px-6 py-3 border-b border-border/50">
            {/* Logo */}
            <Link
              href={buildPath("/")}
              onClick={() => setActiveTab("")}
              aria-label="Home"
              className="flex items-center flex-shrink-0">
              <Image
                src="/wha/logo.png"
                alt="What's Happening Australia"
                width={100}
                height={26}
                className="object-contain w-24 h-auto"
                priority
              />
            </Link>

            {/* Nav links */}
            <nav aria-label="Primary navigation" className="flex items-center gap-8 text-sm font-semibold">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      router.push(buildPath(item.href));
                    }}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative flex items-center gap-2 pb-1 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm ${
                      isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                    }`}>
                    <Image
                      src={isActive ? item.activeImg : item.img}
                      className="h-6 w-6"
                      width={24}
                      height={24}
                      alt=""
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeNavTab"
                        className="absolute -bottom-1 left-0 right-0 h-[2px] bg-primary rounded-full"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Auth */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" aria-label="Account menu">
                      <Avatar className="h-9 w-9 border-2 border-border">
                        <AvatarImage className="object-cover" src={session?.user?.image ?? ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                          {session?.user?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64 p-3 rounded-2xl bg-white shadow-xl border border-border">
                    <p className="font-semibold text-sm">{session.user?.name}</p>
                    <p className="text-xs text-muted-foreground mb-2 truncate">{session.user?.email}</p>
                    <div className="border-t border-border my-2" />
                    <Link href={buildPath("/dashboard")} className="block px-2 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
                      Dashboard
                    </Link>
                    <LogoutDialog />
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href={buildPath("/auth")}>
                  <Button className="rounded-full px-5 font-semibold">Login</Button>
                </Link>
              )}
            </div>
          </div>

          {/* Contextual search bar */}
          {(isEventsPage || isDealsPage || isBusinessPage) && (
            <div className="w-full bg-white px-6 py-2 border-b border-border/50">
              {isEventsPage   && <EventSearchWithDates />}
              {isDealsPage    && <DealsSearchWithDates />}
              {isBusinessPage && <BusinessSearchWithDates />}
            </div>
          )}
        </nav>
      )}
    </>
  );
}
