"use client";

import {
  User,
  Heart,
  Settings,
  LifeBuoy,
  Globe,
  LogOut,
  Ticket,
  BadgeDollarSign,
  Calendar,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import ProfileAvatar from "./ProfilePic";
import { LogoutDialog } from "../ui/LogoutDialog";

export default function MobileDashboard() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const menu1 = [
    {
      name: "Favourites",
      icon: Heart,
      link: "/dashboard/favorite",
    },
    {
      name: "Profile",
      icon: User,
      link: "/dashboard/profile",
    },
    {
      name: "Settings",
      icon: Settings,
      link: "/dashboard/settings",
    },
  ];
  const menuUser = [
    {
      name: "Favourites",
      icon: Heart,
      link: "/dashboard/favorite",
    },
    {
      name: "Profile",
      icon: User,
      link: "/dashboard/profile",
    },
  ];

  const menu2 = [
    {
      name: "Booking",
      icon: Calendar,
      link: "/dashboard/bookings",
    },
    {
      name: "Events",
      icon: Ticket,
      link: "/dashboard/events",
    },
    {
      name: "Deals",
      icon: BadgeDollarSign,
      link: "/dashboard/deals",
    },
  ];

  return (
    <div className="min-h-[50vh] pb-28">
      {/* Header */}
      <div className="flex items-start justify-between  mb-6">
        <div>
          <h1 className="text-xl font-bold">
            {(session?.user as any)?.business_name || session?.user?.name}
          </h1>

          <p className="text-muted text-sm">
            {(session?.user as any)?.category || "Personal profile"}
          </p>
        </div>

        {/* Profile Avatar */}
        <div className="relative">
          <Avatar className="h-12 w-12  rounded-full">
            <AvatarImage
              src={session?.user?.image ? session.user.image : ""}
              alt="User"
              className="object-cover"
            />
            <AvatarFallback>
              {session?.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      {session?.user.category === "business" && (
        <>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 mb-5">
            {menu2.map((item, i) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.link);

              return (
                <Link
                  key={i}
                  href={item.link}
                  className={`flex items-center gap-4 py-4 rounded-xl px-2 transition
              ${
                active
                  ? "bg-gray-100 text-primary"
                  : "hover:bg-gray-50 text-gray-800"
              }`}>
                  <Icon size={22} />
                  <span className="text-lg">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Account Section */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 mb-5">
            {menu1.map((item, i) => {
              const Icon = item.icon;
              const active = pathname.startsWith(item.link);

              return (
                <Link
                  key={i}
                  href={item.link}
                  className={`flex items-center gap-4 py-4 rounded-xl px-2 transition
              ${
                active
                  ? "bg-gray-100 text-primary"
                  : "hover:bg-gray-50 text-gray-800"
              }`}>
                  <Icon size={22} />
                  <span className="text-lg">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {session?.user.category === "user" && (
        <div className="bg-white rounded-2xl p-5 border border-gray-200 mb-5">
          {menuUser.map((item, i) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.link);

            return (
              <Link
                key={i}
                href={item.link}
                className={`flex items-center gap-4 py-4 rounded-xl px-2 transition
              ${
                active
                  ? "bg-gray-100 text-primary"
                  : "hover:bg-gray-50 text-gray-800"
              }`}>
                <Icon size={22} />
                <span className="text-lg">{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-2xl p-5 border border-gray-200">
        <LogoutDialog />
      </div>
    </div>
  );
}
