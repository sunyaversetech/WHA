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
import { ChevronDown } from "lucide-react";
import { LogoutDialog } from "../ui/LogoutDialog";

import BusinessSearchWithDates from "./SearchSectionforBusiness";
import MobileBusinessSearchWithDates from "./MobileViewSearch/SearchSectionforBusiness";

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

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const path = pathname.split("?")[0];
  const isHomePage = path === "/";
  const isDashboard = path.startsWith("/dashboard");
  const isBusinessesPage = path === "/businesses";
  const showMobileSearch = [
    "/events",
    "/deals",
    "/bookings",
    "/favorites",
  ].includes(path);

  /* ── User dropdown (shared) ── */
  const UserDropdown = ({ pillStyle }: { pillStyle?: boolean }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {pillStyle ? (
          /* Fresha-style bordered pill: avatar + chevron */
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
            }}
          >
            <Avatar className="h-9 w-9 border-2 border-border">
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
        ) : (
          /* Compact: just avatar */
          <button
            aria-label="Account menu"
            className="rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <Avatar className="h-9 w-9 border-2 border-border">
              <AvatarImage
                className="object-cover"
                src={session?.user?.image ?? ""}
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                {session?.user?.name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 p-3 rounded-2xl bg-white shadow-xl border border-border"
      >
        <p className="font-semibold text-sm">{session?.user?.name}</p>
        <p className="text-xs text-muted-foreground mb-2 truncate">
          {session?.user?.email}
        </p>
        <div className="border-t border-border my-2" />
        <Link
          href={buildPath("/dashboard")}
          className="block px-2 py-2 rounded-lg text-sm hover:bg-muted transition-colors"
        >
          Dashboard
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
        <Button size={size} className="rounded-full px-5 font-semibold">
          Login
        </Button>
      </Link>
    );

  const solidStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.95)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    boxShadow: "0 1px 0 #e6ebf2, 0 2px 12px rgba(2,12,26,0.06)",
  };
  const clearStyle: React.CSSProperties = {
    background: "transparent",
    backdropFilter: "none",
    WebkitBackdropFilter: "none",
    boxShadow: "none",
  };
  const navStyle: React.CSSProperties = {
    ...(scrolled ? solidStyle : clearStyle),
    transition:
      "background 0.25s ease, box-shadow 0.25s ease, backdrop-filter 0.25s ease",
  };

  /* ════════════════════════════════════
     MOBILE
  ════════════════════════════════════ */
  const MobileNav = () => (
    <div className="md:hidden fixed top-0 left-0 w-full z-50" style={navStyle}>
      {/* Logo + auth row — always shown */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{
          borderBottom: scrolled
            ? "1px solid rgba(230,235,242,0.8)"
            : "1px solid transparent",
        }}
      >
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
     DESKTOP — HOMEPAGE VARIANT
  ════════════════════════════════════ */
  const DesktopHomeNav = () => (
    <nav
      className="hidden md:block fixed top-0 left-0 z-50 w-full"
      style={navStyle}
    >
      <div
        style={{ maxWidth: 1280, margin: "0 auto" }}
        className="flex items-center justify-between px-6 md:px-14 py-4"
      >
        {/* Logo */}
        <Link href={buildPath("/")} aria-label="Home" className="flex-shrink-0">
          <Image
            src="/wha/logo.png"
            alt="What's Happening Australia"
            width={108}
            height={28}
            className="object-contain h-auto"
            priority
          />
        </Link>

        {/* Right side: List your business + auth */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/auth")}
            style={{
              border: "1px solid #d8dfe9",
              background: scrolled
                ? "rgba(255,255,255,0.9)"
                : "rgba(255,255,255,0.6)",
              color: "#0f2748",
              fontWeight: 600,
              fontSize: 15,
              padding: "11px 20px",
              borderRadius: 9999,
              cursor: "pointer",
              transition: "background 0.25s ease",
            }}
          >
            List your business
          </button>

          <AuthSection pillAvatar />
        </div>
      </div>
    </nav>
  );

  /* ════════════════════════════════════
     DESKTOP — INNER PAGES VARIANT
  ════════════════════════════════════ */
  const DesktopInnerNav = () => (
    <nav
      className="hidden md:block fixed top-0 left-0 z-50 w-full"
      style={navStyle}
    >
      <div className="flex items-center gap-6 px-6 py-3">
        {/* Logo */}
        <Link href={buildPath("/")} aria-label="Home" className="flex-shrink-0">
          <Image
            src="/wha/logo.png"
            alt="What's Happening Australia"
            width={104}
            height={28}
            className="object-contain h-auto"
            priority
          />
        </Link>

        {/* Search bar fills available space */}
        <div className="flex-1 min-w-0 max-w-3xl mx-auto">
          <BusinessSearchWithDates />
        </div>

        {/* Auth */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <AuthSection />
        </div>
      </div>
    </nav>
  );

  /* ════════════════════════════════════
     RENDER
  ════════════════════════════════════ */
  return (
    <>
      {!isBusinessesPage && MobileNav()}
      {!isDashboard && (isHomePage ? DesktopHomeNav() : DesktopInnerNav())}
    </>
  );
}
