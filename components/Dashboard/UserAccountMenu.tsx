"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  User,
  Heart,
  CalendarCheck,
  Wallet,
  LogOut,
  ChevronRight,
  type LucideIcon,
  Ticket,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoutDialog } from "@/components/ui/LogoutDialog";

type MenuItem = {
  icon: LucideIcon;
  label: string;
  href?: string;
  comingSoon?: boolean;
};

const accountItems: MenuItem[] = [
  { icon: User, label: "Profile", href: "/dashboard/profile" },
  { icon: Heart, label: "Favourites", href: "/dashboard/favorite" },
  { icon: Ticket, label: "Tickets", href: "/dashboard/tickets" },
  { icon: CalendarCheck, label: "My Bookings", href: "/dashboard/my-bookings" },
];

function MenuRow({ item }: { item: MenuItem }) {
  const Icon = item.icon;
  const content = (
    <div
      className="flex items-center gap-4 px-4 py-4
                 md:flex-col md:items-center md:justify-center md:gap-3 md:px-4 md:py-6 md:text-center
                 md:bg-white md:rounded-2xl md:border md:border-gray-100 md:shadow-sm
                 md:hover:shadow-md md:hover:-translate-y-0.5 md:transition-all">
      <div className="md:bg-primary text-white md:p-3 md:rounded-full">
        <Icon
          className="h-5 w-5 text-white md:h-6 md:w-6 md:text-white"
          strokeWidth={1.75}
        />
      </div>
      <span className="flex-1 text-[15px] font-medium text-gray-900 md:flex-none md:text-sm md:font-semibold">
        {item.label}
      </span>
      {item.comingSoon ? (
        <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          Soon
        </span>
      ) : (
        <ChevronRight className="h-4 w-4 text-gray-300 md:hidden" />
      )}
    </div>
  );

  if (item.comingSoon || !item.href) {
    return (
      <button
        type="button"
        onClick={() => toast("Coming soon")}
        className="w-full text-left hover:bg-gray-50 md:hover:bg-transparent transition-colors">
        {content}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      className="block hover:bg-gray-50 md:hover:bg-transparent transition-colors">
      {content}
    </Link>
  );
}

function MenuGroup({ items }: { items: MenuItem[] }) {
  return (
    <div
      className="bg-white rounded-2xl border  shadow-sm overflow-hidden
                 md:bg-transparent md:border-none md:shadow-none md:overflow-visible">
      <div
        className="divide-y 
                   md:divide-y-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4">
        {items.map((item) => (
          <MenuRow key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function UserAccountMenu() {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "there";
  const email = session?.user?.email ?? "";
  const initials = (session?.user?.name ?? "U").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-md md:max-w-5xl mx-auto space-y-5 md:space-y-8 pb-6">
      <div
        className="flex items-center justify-between gap-4 px-1
                   md:bg-white md:rounded-2xl md:border md:border-gray-100 md:shadow-sm md:px-6 md:py-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 md:h-16 md:w-16">
            <AvatarImage src={session?.user?.image ?? ""} alt={name} />
            <AvatarFallback className="text-base font-semibold md:text-lg bg-primary text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-bold text-gray-900 md:text-xl">{name}</p>
            {email && <p className="text-sm text-gray-500">{email}</p>}
          </div>
        </div>

        <LogoutDialog>
          <button
            type="button"
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border border-red-100 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors">
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Log out
          </button>
        </LogoutDialog>
      </div>

      <MenuGroup items={accountItems} />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden md:hidden">
        <LogoutDialog>
          <button
            type="button"
            className="w-full flex items-center gap-4 px-4 py-4 text-left text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="h-5 w-5" strokeWidth={1.75} />
            <span className="text-[15px] font-semibold">Log out</span>
          </button>
        </LogoutDialog>
      </div>
    </div>
  );
}
