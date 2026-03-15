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
import LiveDateTime from "../ui/date-time";

export default function DashboardNavbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  console.log(session);

  return (
    <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 ml-20 md:ml-56  items-center justify-between px-6 py-3 border-b bg-white shadow-sm">
      <div className="flex items-center gap-4">
        <div className="hidden md:block">
          <LiveDateTime />
        </div>
      </div>
      <div className="flex items-center gap-2">
        {session?.user.category === "user" &&
        pathname.startsWith("/dashboard") ? (
          <Link
            href="/"
            className="text-sm font-medium bg-red-600 text-white px-4 py-2 rounded-lg flex gap-1 items-center">
            <MapPin className="h-4 w-4" />
            <span>Request For Business</span>
          </Link>
        ) : (
          ""
        )}
        <div className="flex items-center">
          {session ? (
            <div className="flex items-center gap-2">
              {session.user.emailVerified ? (
                <Button variant={"outline"} size={"sm"} className="gap-2">
                  <BadgeCheck className="text-blue-300" fill="blue" />
                  Verified
                </Button>
              ) : (
                <Button variant={"outline"} size={"sm"} className="gap-2">
                  <BadgeCheck />
                  Pending Verification
                </Button>
              )}
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
                <DropdownMenuContent
                  align="end"
                  className="w-80 p-4 rounded-2xl shadow-xl bg-white border">
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
                    {!session?.user?.emailVerified && (
                      <Link
                        href="/verify-email"
                        className="flex justify-between items-center p-4 rounded-xl bg-yellow-100 border border-yellow-200 hover:bg-yellow-200 transition">
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
                    )}
                  </div>

                  <div className="my-4 border-t" />
                  {/* Menu Items */}
                  <div className="space-y-2 text-[15px]">
                    <Link
                      href="/dashboard/profile"
                      className="block px-2 py-2 rounded-md hover:bg-gray-100 transition">
                      My profile
                    </Link>
                    {session.user.category === "business" && (
                      <Link
                        href="/dashboard/settings"
                        className="block px-2 py-2 rounded-md hover:bg-gray-100 transition">
                        Personal settings
                      </Link>
                    )}
                  </div>

                  <div className="my-4 border-t" />

                  <div className="space-y-2 text-[15px]">
                    <Link
                      href="/support"
                      className="block px-2 py-2 rounded-md hover:bg-gray-100 transition">
                      Help and support
                    </Link>

                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="w-full text-left px-2 py-2 rounded-md hover:bg-gray-100 transition">
                      Log out
                    </button>
                  </div>
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
