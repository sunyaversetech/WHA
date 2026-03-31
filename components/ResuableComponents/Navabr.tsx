"use client";

import { useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import EventSearchWithDates from "./SearchSectionForEvents";
import HomePageSearchWithDates from "./SearchSection";
import BusinessSearchWithDates from "./SearchSectionforBusiness";

const navItems = [
  {
    id: "event",
    label: "Event",
    isNew: true,
    activeImg: "/navbar/calendar.gif",
    href: "/events",
    img: "/navbar/calendar.png",
  },
  {
    id: "deals",
    label: "Deals",
    isNew: true,
    activeImg: "/navbar/agreement.gif",
    href: "/deals",
    img: "/navbar/agreement.png",
  },
  {
    id: "business",
    label: "Business",
    isNew: true,
    activeImg: "/navbar/corporate-culture.gif",
    href: "/businesses",
    img: "/navbar/corporate-culture.png",
  },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCity = searchParams.get("city");
  const [activeTab, setActiveTab] = useState(
    pathname.startsWith("/events")
      ? "event"
      : pathname.startsWith("/deals")
        ? "deals"
        : pathname.startsWith("/businesses")
          ? "business"
          : "",
  );

  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(false);
      const currentScrollY = window.scrollY;

      if (currentScrollY > 165) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname]);

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.set(key, value);
          if (key === "city") localStorage.setItem("preferredCity", value);
        } else {
          params.delete(key);
          if (key === "city") localStorage.removeItem("preferredCity");
        }
      });

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, pathname],
  );

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

  return (
    <nav
      className={`${isSticky ? "fixed bg-white w-full h-22" : ""} top-0 z-[9999] flex items-center justify-between px-6 py-3 border-white/20`}>
      <Link
        href={buildPath("/")}
        onClick={() => setActiveTab("")}
        className="flex items-center">
        <Image
          src="/wha/logo.png"
          alt="logo"
          width={100}
          height={20}
          className="object-contain w-20 h-auto"
          priority
        />
      </Link>
      {/* {[
            { name: "Events", href: "/events" },
            { name: "Deals", href: "/deals" },
            { name: "Businesses", href: "/businesses" },
          ].map((item) => (
            <Link
              key={item.href}
              href={buildPath(item.href)}
              className={`px-5 py-2 rounded-full transition-colors ${
                isActive(item.href)
                  ? "bg-primary text-white shadow"
                  : "text-primary hover:bg-white/20"
              }`}>
              {item.name}
            </Link>
          ))} */}
      {/* || pathname.startsWith("/deals") || pathname.startsWith("/businesses") */}
      {!pathname.startsWith("/dashboard") && (
        <div className="hidden md:flex items-center gap-10  rounded-full p-1 - text-sm font-medium">
          {isSticky && pathname === "/" ? (
            <HomePageSearchWithDates />
          ) : isSticky && pathname.startsWith("/events") ? (
            <EventSearchWithDates />
          ) : isSticky && pathname.startsWith("/deals") ? (
            <EventSearchWithDates />
          ) : isSticky && pathname.startsWith("/businesses") ? (
            <BusinessSearchWithDates />
          ) : (
            navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    router.push(buildPath(item.href));
                  }}
                  className={`group relative flex items-center gap-2 pb-2 transition-colors ${
                    isActive ? "text-black" : "text-gray-500 hover:text-black"
                  }`}>
                  <div className="flex gap-2 items-center">
                    <div className="flex">
                      <Image
                        src={`${isActive ? item.activeImg : item.img}`}
                        className={`${isActive ? "h-10 w-10" : "h-7 w-7"}`}
                        width={isActive ? 100 : 28}
                        height={isActive ? 100 : 28}
                        alt={`${item.label} icon`}
                      />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-black"
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md border border-primary text-primary text-sm hover:bg-white/30 transition focus:outline-none">
              <MapPin className="h-4 w-4" />
              <span className="capitalize">{currentCity ?? "Australia"}</span>
              <ChevronDown className="h-4 w-4 opacity-70" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="rounded-xl bg-white/90 backdrop-blur-lg border border-white/30 shadow-xl p-2">
            {["Australia", "sydney", "canberra"].map((city) => (
              <DropdownMenuItem
                key={city}
                onSelect={() =>
                  updateQuery({ city: city === "Australia" ? null : city })
                }
                className="capitalize cursor-pointer">
                {city}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="h-10 w-10 border rounded-full border-white/30">
                <AvatarImage src={session?.user?.image ?? ""} />
                <AvatarFallback>
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-64 p-3 rounded-2xl bg-white/90 backdrop-blur-lg shadow-xl">
              <p className="font-semibold">{session.user?.name}</p>
              <p className="text-sm text-muted-foreground mb-2">
                {session.user?.email}
              </p>
              <div className="border-t my-2" />
              <Link
                href={buildPath("/dashboard")}
                className="block px-2 py-2 rounded-md hover:bg-gray-100">
                Dashboard
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left px-2 py-2 rounded-md hover:bg-gray-100">
                Logout
              </button>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="hidden md:flex gap-2">
            <Link href={buildPath("/auth")}>
              <Button className="rounded-full px-5 bg-white/20 backdrop-blur-md text-primary hover:bg-primary hover:text-white">
                Login
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
