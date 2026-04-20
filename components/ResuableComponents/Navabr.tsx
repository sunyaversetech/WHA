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

import { LogoutDialog } from "../ui/LogoutDialog";

// Desktop search (optional)
import EventSearchWithDates from "./SearchSectionForEvents";
import BusinessSearchWithDates from "./SearchSectionforBusiness";
import DealsSearchWithDates from "./SearchSectionForDeals";

// Mobile search
import MobileEventSearchWithDates from "./MobileViewSearch/SearchSectionForEvents";
import MobileBusinessSearchWithDates from "./MobileViewSearch/SearchSectionforBusiness";
import MobileDealsSearchWithDates from "./MobileViewSearch/SearchSectionForDeals";

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

  const path = pathname.split("?")[0];

  const isEventsPage = path === "/events";
  const isDealsPage = path === "/deals";
  const isBusinessPage = path === "/businesses";

  const isDashboard = path.startsWith("/dashboard");

  const showMobileSearch = isEventsPage || isDealsPage || isBusinessPage;

  return (
    // <nav
    //   className={`${isSticky && pathname === "/" ? "fixed bg-white w-full h-15" : isSticky && pathname !== "/" ? "fixed bg-white w-full h-22" : ""} top-0 z-49 hidden md:flex items-center md:justify-between justify-center px-6 py-3 border-white/20`}
    // >
    //   <Link
    //     href={buildPath("/")}
    //     onClick={() => setActiveTab("")}
    //     className="md:flex hidden items-center"
    //   >
    //     <Image
    //       src="/wha/logo.png"
    //       alt="logo"
    //       width={100}
    //       height={20}
    //       className="object-contain w-20 h-auto"
    //       priority
    //     />
    //   </Link>
    //   {!pathname.startsWith("/dashboard") && (
    //     <div className="flex items-center gap-10  rounded-full p-1 - text-sm font-medium transition-all duration-300">
    //       {isSticky && pathname.startsWith("/events") ? (
    //         <AnimatePresence>
    //           <motion.div
    //             key="sticky-search"
    //             initial={{ y: 50, opacity: 0 }}
    //             animate={{ y: 0, opacity: 1 }}
    //             exit={{ y: 50, opacity: 0 }}
    //             transition={{ type: "spring", stiffness: 300, damping: 30 }}
    //             className="absolute left-0 right-0 max-md:hidden"
    //           >
    //             <EventSearchWithDates sticky={isSticky} />
    //           </motion.div>
    //         </AnimatePresence>
    //       ) : isSticky && pathname.startsWith("/deals") ? (
    //         <AnimatePresence>
    //           <motion.div
    //             key="sticky-search"
    //             initial={{ y: 50, opacity: 0 }}
    //             animate={{ y: 0, opacity: 1 }}
    //             exit={{ y: 50, opacity: 0 }}
    //             transition={{ type: "spring", stiffness: 300, damping: 30 }}
    //             className="absolute left-0 right-0 max-md:hidden"
    //           >
    //             <EventSearchWithDates sticky={isSticky} />
    //           </motion.div>
    //         </AnimatePresence>
    //       ) : isSticky && pathname.startsWith("/businesses") ? (
    //         <BusinessSearchWithDates sticky={isSticky} />
    //       ) : (
    //         navItems.map((item) => {
    //           const isActive = activeTab === item.id;
    //           return (
    //             <button
    //               key={item.id}
    //               onClick={() => {
    //                 setActiveTab(item.id);
    //                 router.push(buildPath(item.href));
    //               }}
    //               className={`group relative cursor-pointer flex items-center gap-2 pb-2 transition-all duration-500 ${
    //                 isActive ? "text-black" : "text-gray-500 hover:text-black"
    //               }`}
    //             >
    //               <div className="flex gap-2 items-center">
    //                 <div className="flex">
    //                   <Image
    //                     src={`${isActive ? item.activeImg : item.img}`}
    //                     className={`${isActive ? "h-7 w-7" : "h-7 w-7"}`}
    //                     width={isActive ? 80 : 28}
    //                     height={isActive ? 80 : 28}
    //                     alt={`${item.label} icon`}
    //                   />
    //                 </div>
    //                 <span className="text-sm font-medium">{item.label}</span>
    //               </div>

    //               {isActive && (
    //                 <motion.div
    //                   layoutId="activeTab"
    //                   className="absolute -bottom-[5px] left-0 right-0 h-[2px] bg-black"
    //                   transition={{
    //                     type: "spring",
    //                     stiffness: 380,
    //                     damping: 30,
    //                   }}
    //                 />
    //               )}
    //             </button>
    //           );
    //         })
    //       )}
    //     </div>
    //   )}

    //   <div className="md:flex hidden items-center gap-3">
    //     {session ? (
    //       <DropdownMenu>
    //         <DropdownMenuTrigger>
    //           <Avatar className="h-10 w-10 border rounded-full border-white/30">
    //             <AvatarImage
    //               className="object-cover"
    //               src={session?.user?.image ?? ""}
    //             />
    //             <AvatarFallback>
    //               {session?.user?.name?.charAt(0) || "U"}
    //             </AvatarFallback>
    //           </Avatar>
    //         </DropdownMenuTrigger>

    //         <DropdownMenuContent
    //           align="end"
    //           className="w-68 p-3 rounded-2xl bg-white/90 backdrop-blur-lg shadow-xl"
    //         >
    //           <p className="font-semibold">{session.user?.name}</p>
    //           <p className="text-sm text-muted-foreground mb-2 truncate">
    //             {session.user?.email}
    //           </p>
    //           <div className="border-t my-2" />
    //           <Link
    //             href={buildPath("/dashboard")}
    //             className="block px-2 py-2 rounded-md hover:bg-gray-100"
    //           >
    //             Dashboard
    //           </Link>
    //           <div className="-ml-2 ">
    //             <LogoutDialog />
    //           </div>
    //         </DropdownMenuContent>
    //       </DropdownMenu>
    //     ) : (
    //       <div className="hidden md:flex gap-2">
    //         <Link href={buildPath("/auth")}>
    //           <Button className="rounded-full cursor-pointer px-5 bg-white/20 backdrop-blur-md text-primary hover:bg-primary hover:text-white">
    //             Login
    //           </Button>
    //         </Link>
    //       </div>
    //     )}
    //   </div>
    // </nav>

    // new fixed navbar
    <>
      <div className="md:hidden fixed top-0 left-0 w-full z-50 bg-white">
        {showMobileSearch && (
          <>
            {isEventsPage && <MobileEventSearchWithDates />}
            {isDealsPage && <MobileDealsSearchWithDates />}
            {isBusinessPage && <MobileBusinessSearchWithDates />}
          </>
        )}
      </div>

      {!isDashboard && (
        <nav className="fixed top-0 left-0 z-50 w-full bg-white hidden md:block shadow-sm">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Logo */}
            <Link
              href={buildPath("/")}
              onClick={() => setActiveTab("")}
              className="flex items-center"
            >
              <Image
                src="/wha/logo.png"
                alt="logo"
                width={100}
                height={20}
                className="object-contain w-20 h-auto"
                priority
              />
            </Link>

            {/* Nav Items */}
            <div className="flex items-center gap-10 text-sm font-medium">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      router.push(buildPath(item.href));
                    }}
                    className={`relative flex items-center gap-2 pb-2 transition-all duration-300 ${
                      isActive ? "text-black" : "text-gray-500 hover:text-black"
                    }`}
                  >
                    <Image
                      src={isActive ? item.activeImg : item.img}
                      className="h-7 w-7"
                      width={28}
                      height={28}
                      alt={item.label}
                    />

                    <span>{item.label}</span>

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
              })}
            </div>

            {/* Auth */}
            <div className="flex items-center gap-3">
              {session ? (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Avatar className="h-10 w-10 border rounded-full">
                      <AvatarImage src={session?.user?.image ?? ""} />
                      <AvatarFallback>
                        {session?.user?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    align="end"
                    className="w-68 p-3 rounded-2xl bg-white/90 backdrop-blur-lg shadow-xl"
                  >
                    <p className="font-semibold">{session.user?.name}</p>
                    <p className="text-sm text-muted-foreground mb-2 truncate">
                      {session.user?.email}
                    </p>

                    <div className="border-t my-2" />

                    <Link
                      href={buildPath("/dashboard")}
                      className="block px-2 py-2 rounded-md hover:bg-gray-100"
                    >
                      Dashboard
                    </Link>

                    <LogoutDialog />
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href={buildPath("/auth")}>
                  <Button className="rounded-full px-5">Login</Button>
                </Link>
              )}
            </div>
          </div>

          <div className="w-full bg-white px-6 py-2">
            {isEventsPage && <EventSearchWithDates />}
            {isDealsPage && <DealsSearchWithDates />}
            {isBusinessPage && <BusinessSearchWithDates />}
          </div>
        </nav>
      )}
    </>
  );
}
