"use client";

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
import { useCallback } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentCity = searchParams.get("city");

  const isActive = (path: string) => pathname === path;

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const buildPath = (href: string) => {
    if (!currentCity) return href;
    return `${href}?city=${currentCity}`;
  };

  return (
    <nav
      className="sticky top-0 z-[9999] flex items-center justify-between px-6 py-3
    bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg"
    >
      {/* Logo */}
      <Link href={buildPath("/")} className="flex items-center">
        <Image
          src="/wha/logo.png"
          alt="logo"
          width={100}
          height={20}
          className="object-contain w-20 h-auto"
          priority
        />
      </Link>

      {/* Center Nav */}
      {!pathname.startsWith("/dashboard") && (
        <div
          className="hidden md:flex items-center
        bg-white/20 backdrop-blur-lg border border-priamry
        rounded-full p-1 gap-1 text-sm font-medium shadow-md"
        >
          {[
            { name: "Events", href: "/events" },
            { name: "Businesses", href: "/businesses" },
          ].map((item) => (
            <Link
              key={item.href}
              href={buildPath(item.href)}
              className={`px-5 py-2 rounded-full transition-all duration-300
              ${
                isActive(item.href)
                  ? "bg-primary text-white shadow"
                  : "text-primary hover:bg-white/20"
              }`}
            >
              {item.name}
            </Link>
          ))}

          {/* {status === "authenticated" && (
            <Link
              href={buildPath("/dashboard")}
              className={`px-5 py-2 rounded-full transition-all duration-300
              ${
                isActive("/dashboard")
                  ? "bg-primary text-white shadow"
                  : "text-primary hover:bg-white/20"
              }`}
            >
              Dashboard
            </Link>
          )} */}
        </div>
      )}

      {/* Right Section */}
      <div className="flex items-center gap-3">
        {/* City Filter - Redesigned */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-full
            bg-white/20 backdrop-blur-md border border-primary
            text-primary text-sm hover:bg-white/30 transition focus:outline-none focus:ring-0 focus-visible:ring-0"
            >
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
                className="capitalize cursor-pointer"
              >
                {city}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Auth Section */}
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
              className="w-64 p-3 rounded-2xl bg-white/90 backdrop-blur-lg shadow-xl"
            >
              <p className="font-semibold">{session.user?.name}</p>
              <p className="text-sm text-muted-foreground mb-2">
                {session.user?.email}
              </p>

              <div className="border-t my-2" />

              <Link
                href="/dashboard"
                className="block px-2 py-2 rounded-md hover:bg-gray-100"
              >
                Dashboard
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full text-left px-2 py-2 rounded-md hover:bg-gray-100"
              >
                Logout
              </button>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="hidden md:flex gap-2">
            <Link href="/auth">
              <Button className="rounded-full px-5 bg-white/20 backdrop-blur-md text-priamry hover:bg-primary hover:text-white">
                Login
              </Button>
            </Link>

            {/* <Link href="/auth">
              <Button
                variant="outline"
                className="rounded-full px-5 border-white/40 text-white hover:bg-white/20"
              >
                Sign up
              </Button>
            </Link> */}
          </div>
        )}
      </div>
    </nav>
  );
}
