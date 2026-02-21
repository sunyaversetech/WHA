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
import { User, Settings, LogOut } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b bg-white">
      <Link href="/" className="flex items-center">
        <div className="bg-red-600 p-2 rounded-md">
          <span className="text-white font-bold text-xl">WH</span>
          <p className="text-[8px] text-white leading-none text-center">
            AUSTRALIA
          </p>
        </div>
      </Link>

      <div className="hidden md:flex items-center border rounded-full px-6 py-2 gap-8 text-slate-600 font-medium shadow-sm">
        <Link href="/events" className="hover:text-red-600 transition-colors">
          Events
        </Link>
        <Link href="/deals" className="hover:text-red-600 transition-colors">
          Deals
        </Link>
        <Link
          href="/businesses"
          className="hover:text-red-600 transition-colors">
          Businesses
        </Link>
        <Link href="/menu" className="hover:text-red-600 transition-colors">
          Menu
        </Link>
      </div>

      <div className="flex items-center">
        {session ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="outline-none">
              <Avatar className="h-9 w-9 border">
                <AvatarImage
                  src={session?.user?.image ? session.user.image : ""}
                  alt="User"
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
                  href="/dashboard/profile"
                  className="flex items-center cursor-pointer">
                  <User className="mr-2 h-4 w-4" /> Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="flex items-center cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onClick={() => signOut({ callbackUrl: "/" })}>
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/auth"
            className="text-sm font-medium bg-red-600 text-white px-4 py-2 rounded-lg">
            Login
          </Link>
        )}
      </div>
    </nav>
  );
}
