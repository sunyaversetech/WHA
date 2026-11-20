"use client";

import { useEffect } from "react";
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
import { ChevronDown } from "lucide-react";
import { LogoutDialog } from "../ui/LogoutDialog";

import SearchHeader from "./SearchHeader";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCity = searchParams.get("city");

  useEffect(() => {
    const savedCity = localStorage.getItem("preferredCity");
    if (savedCity && !currentCity) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("city", savedCity);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    }
  }, [currentCity, pathname, router, searchParams]);

  const buildPath = (href: string) =>
    currentCity ? `${href}?city=${currentCity}` : href;

  const path = pathname.split("?")[0];
  const isDashboard = path.startsWith("/dashboard");
  const isBusinessesPage = path === "/businesses";
  // "/" renders the same search/business-listing content as "/search" — both
  // get the Fresha-matched header instead of the generic one.
  const isSearchPage = path === "/" || path === "/search";

  /* ── User dropdown (shared) ── */
  const UserDropdown = ({ pillStyle }: { pillStyle?: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Account menu"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid #e6ebf2",
            background: "#fff",
            borderRadius: 9999,
            padding: "5px 10px 5px 5px",
            cursor: "pointer",
            outline: "none",
            boxShadow: "none",
          }}>
          <Avatar className="h-9 w-9 rounded-full">
            <AvatarImage
              className="object-cover"
              src={session?.user?.image ?? ""}
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
              {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <ChevronDown size={18} color="#64748b" strokeWidth={2.2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 p-3 rounded-2xl bg-white shadow-xl border border-border outline-none focus:outline-none focus:ring-0">
        <p className="font-semibold text-sm">{session?.user?.name}</p>

        <div className="border-t border-border my-2" />
        <Link
          href={buildPath(
            session?.user?.category === "business"
              ? "/dashboard/calendar"
              : "/dashboard",
          )}
          className="block px-2 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
          Dashboard
        </Link>
        <Link
          href={buildPath("/activity")}
          className="block px-2 py-2 rounded-lg text-sm hover:bg-muted transition-colors">
          My Activity
        </Link>
        <LogoutDialog />
      </DropdownMenuContent>
    </DropdownMenu>
  );

  /* ── Auth section (logged-in or login button) ── */
  const AuthSection = ({
    size = "default",
    pillAvatar = false,
  }: {
    size?: "sm" | "default";
    pillAvatar?: boolean;
  }) =>
    session ? (
      <UserDropdown pillStyle={pillAvatar} />
    ) : (
      <Link href={buildPath("/auth")}>
        {!pathname.startsWith("/auth") && (
          <Button size={size} className="rounded-full px-5 font-semibold">
            Login
          </Button>
        )}
      </Link>
    );

  // Always-solid fixed header — matches SearchHeader's treatment on
  // / and /search, so the header reads the same (and stays put the same
  // way) across every page instead of fading in/out as the page scrolls.
  const solidStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 1px 0 #e6ebf2, 0 2px 12px rgba(2,12,26,0.06)",
  };

  /* ════════════════════════════════════
     MOBILE
  ════════════════════════════════════ */
  const MobileNav = () => (
    <div className="hidden fixed top-0 left-0 w-full z-50" style={solidStyle}>
      {/* Logo + auth row — always shown */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: "1px solid rgba(230,235,242,0.8)" }}>
        <Link href={buildPath("/")} aria-label="Home">
          <Image
            src="/wha/logo.png"
            alt="What's Happening Australia"
            width={60}
            height={24}
            className="object-contain h-auto"
            priority
          />
        </Link>
        {session && <AuthSection size="sm" />}
      </div>

      {/* Search row — only on pages where it makes sense */}
      {/* {showMobileSearch && (
        <div className="px-4 py-3">
          <MobileBusinessSearchWithDates />
        </div>
      )} */}
    </div>
  );

  /* ════════════════════════════════════
     RENDER
  ════════════════════════════════════ */
  return (
    <>
      {/* /search (and /) own their <1024 compact bar inside BusinessPage.tsx
         instead — nothing from here on mobile. */}
      {!isSearchPage && !isBusinessesPage && !isDashboard && MobileNav()}
      {/* One header, same component, on every non-dashboard page — desktop
         only (>=1024px); each page's own mobile layout handles <1024px. */}
      {!isDashboard && (
        <div className="hidden lg:block">
          <SearchHeader />
        </div>
      )}
    </>
  );
}
