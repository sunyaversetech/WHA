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
import { AnimatePresence, motion } from "framer-motion";
import EventSearchWithDates from "./SearchSectionForEvents";
import BusinessSearchWithDates from "./SearchSectionforBusiness";
import { LogoutDialog } from "../ui/LogoutDialog";

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
      className={`${isSticky && pathname === "/" ? "fixed bg-white w-full h-15" : isSticky && pathname !== "/" ? "fixed bg-white w-full h-22" : ""} top-0 z-49 hidden md:flex items-center md:justify-between justify-center px-6 py-3 border-white/20`}>
      <Link
        href={buildPath("/")}
        onClick={() => setActiveTab("")}
        className="md:flex hidden items-center">
        <Image
          src="/wha/logo.png"
          alt="logo"
          width={100}
          height={20}
          className="object-contain w-20 h-auto"
          priority
        />
      </Link>
      {!pathname.startsWith("/dashboard") && (
        <div className="flex items-center gap-10  rounded-full p-1 - text-sm font-medium transition-all duration-300">
          {isSticky && pathname.startsWith("/events") ? (
            <AnimatePresence>
              <motion.div
                key="sticky-search"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute left-0 right-0 max-md:hidden">
                <EventSearchWithDates sticky={isSticky} />
              </motion.div>
            </AnimatePresence>
          ) : isSticky && pathname.startsWith("/deals") ? (
            <AnimatePresence>
              <motion.div
                key="sticky-search"
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="absolute left-0 right-0 max-md:hidden">
                <EventSearchWithDates sticky={isSticky} />
              </motion.div>
            </AnimatePresence>
          ) : isSticky && pathname.startsWith("/businesses") ? (
            <BusinessSearchWithDates sticky={isSticky} />
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
                  className={`group relative cursor-pointer flex items-center gap-2 pb-2 transition-all duration-500 ${
                    isActive ? "text-black" : "text-gray-500 hover:text-black"
                  }`}>
                  <div className="flex gap-2 items-center">
                    <div className="flex">
                      <Image
                        src={`${isActive ? item.activeImg : item.img}`}
                        className={`${isActive ? "h-7 w-7" : "h-7 w-7"}`}
                        width={isActive ? 80 : 28}
                        height={isActive ? 80 : 28}
                        alt={`${item.label} icon`}
                      />
                    </div>
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>

                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-[5px] left-0 right-0 h-[2px] bg-black"
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

      <div className="md:flex hidden items-center gap-3">
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Avatar className="h-10 w-10 border rounded-full border-white/30">
                <AvatarImage
                  className="object-cover"
                  src={session?.user?.image ?? ""}
                />
                <AvatarFallback>
                  {session?.user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-68 p-3 rounded-2xl bg-white/90 backdrop-blur-lg shadow-xl">
              <p className="font-semibold">{session.user?.name}</p>
              <p className="text-sm text-muted-foreground mb-2 truncate">
                {session.user?.email}
              </p>
              <div className="border-t my-2" />
              <Link
                href={buildPath("/dashboard")}
                className="block px-2 py-2 rounded-md hover:bg-gray-100">
                Dashboard
              </Link>
              <div className="-ml-2 ">
                <LogoutDialog />
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="hidden md:flex gap-2">
            <Link href={buildPath("/auth")}>
              <Button className="rounded-full cursor-pointer px-5 bg-white/20 backdrop-blur-md text-primary hover:bg-primary hover:text-white">
                Login
              </Button>
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
