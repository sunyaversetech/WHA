"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, MapPin, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "./ui/button";

export default function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 py-3 border-b bg-white">
      <Link href="/" className="flex items-center">
        <Image
          src="/wha/logo.png"
          alt="Whats Happening Australia Logo"
          width={100}
          height={20}
          className="object-contain"
          priority
        />
      </Link>

      {!pathname.startsWith("/dashboard") ? (
        <div className="hidden md:flex items-center bg-muted/40 backdrop-blur-sm border border-primary rounded-full p-1 gap-1 text-sm font-medium">
          {[
            { name: "Events", href: "/events" },
            { name: "Deals", href: "/deals" },
            { name: "Businesses", href: "/businesses" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-5 py-2 rounded-full transition-all duration-300 ease-in-out
        ${
          isActive(item.href)
            ? "bg-primary text-white shadow-sm"
            : "text-primary hover:bg-primary/10 hover:text-primary"
        }
      `}
            >
              {item.name}
            </Link>
          ))}

          {status === "authenticated" && (
            <Link
              href="/dashboard"
              className={`px-5 py-2 rounded-full transition-all duration-300 ease-in-out
        ${
          isActive("/dashboard")
            ? "bg-primary text-white shadow-sm"
            : "text-primary hover:bg-primary/10 hover:text-primary"
        }
      `}
            >
              Dashboard
            </Link>
          )}
        </div>
      ) : (
        ""
      )}
      <div className="flex gap-2">
        {session?.user.category === "user" &&
        pathname.startsWith("/dashboard") ? (
          <Link
            href="/"
            className="text-sm font-medium bg-red-600 text-white px-4 py-2 rounded-lg flex gap-1 items-center"
          >
            <MapPin className="h-4 w-4" />
            <span>Request For Business</span>
          </Link>
        ) : (
          <Button variant="outline" asChild>
            <Link href="/" className="gap-2">
              <MapPin className="h-6 w-6" />
              Australia
            </Link>
          </Button>
        )}
        <div className="flex items-center">
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="outline-none">
                <Avatar className="h-10 w-10 md:h-12 md:w-12 border rounded-full">
                  <AvatarImage
                    src={session?.user?.image ? session.user.image : ""}
                    alt="User"
                    className="object-cover"
                  />
                  <AvatarFallback>
                    {session?.user?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 p-4 rounded-2xl shadow-xl bg-white border"
              >
                {/* Profile Header */}
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 rounded-full">
                    <AvatarImage
                      src={session?.user?.image ?? ""}
                      alt="User"
                      className="object-cover"
                    />
                    <AvatarFallback>
                      {session?.user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div>
                    <p className="font-semibold text-lg leading-none">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Business Account
                    </p>
                  </div>
                </div>

                {/* Verify Box */}
                <div className="mt-4">
                  <Link
                    href="/verify-email"
                    className="flex justify-between items-center p-4 rounded-xl bg-yellow-100 border border-yellow-200 hover:bg-yellow-200 transition"
                  >
                    <div>
                      <p className="font-medium text-sm">
                        Verify your email address
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Secure your account
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="my-4 border-t" />
                {/* Menu Items */}
                <div className="space-y-2 text-[15px]">
                  <Link
                    href="/dashboard/profile"
                    className="block px-2 py-2 rounded-md hover:bg-gray-100 transition"
                  >
                    My profile
                  </Link>

                  <Link
                    href="/settings"
                    className="block px-2 py-2 rounded-md hover:bg-gray-100 transition"
                  >
                    Personal settings
                  </Link>
                </div>

                <div className="my-4 border-t" />

                <div className="space-y-2 text-[15px]">
                  <Link
                    href="/support"
                    className="block px-2 py-2 rounded-md hover:bg-gray-100 transition"
                  >
                    Help and support
                  </Link>

                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-2 py-2 rounded-md hover:bg-gray-100 transition"
                  >
                    Log out
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <div className="hidden md:flex">
                <Button asChild>
                  <Link href="/auth">Login</Link>
                </Button>
              </div>
              <div className="flex justify-center items-center border-l-2 pl-2">
                <Link href="/auth/business" className="text-primary">
                  For Business
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
