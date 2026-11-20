"use client";

import { Suspense, useEffect } from "react";
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

// Runs the "remembered city" redirect — the only reason this file used to
// call useSearchParams() at Navbar's top level, which forced the WHOLE
// component — including the always-visible SearchHeader below, which
// doesn't read search params at all — behind a Suspense fallback during
// static rendering (confirmed: the statically-generated HTML for "/" had
// no nav, no links, nothing, until this was isolated). Renders nothing, so
// its own Suspense boundary never has anything visible to fall back to.
function CityRedirectEffect() {
  const router = useRouter();
  const pathname = usePathname();
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

  return null;
}

function MobileUserDropdown({
  session,
  buildPath,
}: {
  session: ReturnType<typeof useSession>["data"];
  buildPath: (href: string) => string;
}) {
  return (
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
}

function MobileAuthSection({
  session,
  pathname,
  buildPath,
}: {
  session: ReturnType<typeof useSession>["data"];
  pathname: string;
  buildPath: (href: string) => string;
}) {
  return session ? (
    <MobileUserDropdown session={session} buildPath={buildPath} />
  ) : (
    <Link href={buildPath("/auth")}>
      {!pathname.startsWith("/auth") && (
        <Button size="sm" className="rounded-full px-5 font-semibold">
          Login
        </Button>
      )}
    </Link>
  );
}

// Permanently hidden (className="hidden ..." below, unconditionally — this
// predates this change) on every page that renders it, but still needs its
// own useSearchParams() for the ?city= it appends to its links, so it gets
// its own small Suspense boundary instead of sharing Navbar's.
function MobileNav() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCity = searchParams.get("city");
  const buildPath = (href: string) =>
    currentCity ? `${href}?city=${currentCity}` : href;

  return (
    <div
      className="hidden fixed top-0 left-0 w-full z-50"
      style={{
        background: "rgba(255,255,255,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow: "0 1px 0 #e6ebf2, 0 2px 12px rgba(2,12,26,0.06)",
      }}>
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
        {session && (
          <MobileAuthSection
            session={session}
            pathname={pathname}
            buildPath={buildPath}
          />
        )}
      </div>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();

  const path = pathname.split("?")[0];
  const isDashboard = path.startsWith("/dashboard");
  const isBusinessesPage = path === "/businesses";
  // "/" renders the same search/business-listing content as "/search" — both
  // get the Fresha-matched header instead of the generic one.
  const isSearchPage = path === "/" || path === "/search";

  return (
    <>
      <Suspense fallback={null}>
        <CityRedirectEffect />
      </Suspense>
      {/* /search (and /) own their <1024 compact bar inside BusinessPage.tsx
         instead — nothing from here on mobile. */}
      {!isSearchPage && !isBusinessesPage && !isDashboard && (
        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
      )}
      {/* One header, same component, on every non-dashboard page — desktop
         only (>=1024px); each page's own mobile layout handles <1024px.
         Doesn't read search params, so it's deliberately outside every
         Suspense boundary above — it must never wait on one. */}
      {!isDashboard && (
        <div className="hidden lg:block">
          <SearchHeader />
        </div>
      )}
    </>
  );
}
