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
import {
  User,
  Settings,
  LogOut,
  MapPin,
  ChevronRight,
  Bell,
  BadgeCheck,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Button } from "../ui/button";

export default function DashboardNavbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  return (
    <nav
      className={`${!pathname.startsWith("/dashboard") ? "container-modern" : ""} flex items-center justify-between px-6 py-3 border-b bg-white `}
    >
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
          ""
        )}
        <div className="flex items-center">
          {session ? (
            <div className="flex items-center gap-2">
              <Button variant={"outline"} size={"sm"} className="gap-2">
                <BadgeCheck />
                Pending Verification
              </Button>
              <div className="px-2 py-2 hover:bg-[#f5f5f5] rounded-sm">
                <Bell className="h-6 w-6" />
              </div>
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
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard"
                      className="flex items-center cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" /> Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center cursor-pointer"
                    >
                      <User className="mr-2 h-4 w-4" /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      className="flex items-center cursor-pointer"
                    >
                      <Settings className="mr-2 h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 cursor-pointer"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button asChild>
              <Link href="/auth">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
