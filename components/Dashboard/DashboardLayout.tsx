"use client";
import React, { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Sidebar from "../ResuableComponents/Sidebar";
import UserSidebar from "../ResuableComponents/User-Sidebar";
import {
  Search,
  Bell,
  BarChart2,
  MessageCircle,
  ChevronRight,
  X,
  Star,
  Tag,
  Zap,
  CalendarDays,
  CalendarX2,
  UserPlus,
  CircleDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PROTECTED_PATHS = [
  "/dashboard/bookings",
  "/dashboard/deals",
  "/dashboard/inventory",
  "/dashboard/settings",
  "/dashboard/complete-profile",
];

type NotifCategory =
  | "Appointments"
  | "Reviews"
  | "Tips"
  | "Online sales"
  | "Actions";

const NOTIF_CATEGORIES: { label: NotifCategory; icon: React.ReactNode }[] = [
  { label: "Appointments", icon: <CalendarDays size={18} /> },
  { label: "Reviews", icon: <Star size={18} /> },
  { label: "Tips", icon: <CircleDollarSign size={18} /> },
  { label: "Online sales", icon: <Tag size={18} /> },
  { label: "Actions", icon: <Zap size={18} /> },
];

const SAMPLE_NOTIFICATIONS = [
  {
    id: 1,
    category: "Appointments" as NotifCategory,
    title: "New appointment (DEMO)",
    time: "5 days ago",
    body: "12:00 Tue, Jun 30 Blow Dry for Jack booked with Wendy",
    initials: "J",
  },
  {
    id: 2,
    category: "Appointments" as NotifCategory,
    title: "New appointment (DEMO)",
    time: "5 days ago",
    body: "13:00 Tue, Jun 30 Hair Color for Jane booked with you",
    initials: "J",
  },
  {
    id: 3,
    category: "Appointments" as NotifCategory,
    title: "New appointment (DEMO)",
    time: "5 days ago",
    body: "11:00 Tue, Jun 30 Haircut for John booked with you",
    initials: "J",
  },
];

const SAMPLE_CLIENTS = [
  { id: 1, name: "Jack Doe", email: "jack@example.com" },
  { id: 2, name: "Jane Doe", email: "jane@example.com" },
  { id: 3, name: "John Doe", email: "john@example.com" },
];

function TopBarBtn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
      {children}
    </button>
  );
}

function ProfileDropdown({
  name,
  onClose,
}: {
  name: string;
  onClose: () => void;
}) {
  const initials = name.slice(0, 2).toUpperCase();
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-11 w-72 bg-[#1c1c1c] rounded-2xl shadow-2xl overflow-hidden z-50 border border-[#2a2a2a]">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="w-10 h-10 rounded-full bg-[#3d6b8f] flex items-center justify-center text-sm font-bold text-white shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-gray-400">No reviews yet</p>
          </div>
        </div>
        <div className="mx-3 mb-2 bg-[#2d1c0a] border border-[#4a2e0d] rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-[#361f09] transition-colors">
          <div>
            <p className="text-sm font-semibold text-white">
              Verify your email address
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Secure your account</p>
          </div>
          <ChevronRight size={16} className="text-gray-400 shrink-0 ml-2" />
        </div>
        <div className="py-1">
          {["My profile", "Personal settings"].map((item) => (
            <button
              key={item}
              type="button"
              className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-[#252525] transition-colors">
              {item}
            </button>
          ))}
        </div>
        <div className="h-px bg-[#2a2a2a]" />
        <div className="py-1">
          {["Help and support", "English (US) us"].map((item) => (
            <button
              key={item}
              type="button"
              className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-[#252525] transition-colors">
              {item}
            </button>
          ))}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-[#252525] transition-colors">
            Log out
          </button>
        </div>
      </div>
    </>
  );
}

function SearchOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-[#0d0d0d] flex flex-col">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-6 right-6 w-10 h-10 rounded-full border border-[#333] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#555] transition-colors">
        <X size={18} />
      </button>
      <div className="flex-1 flex flex-col justify-start pt-24 px-8 md:px-16 max-w-6xl w-full mx-auto">
        <div className="border-b border-[#2a2a2a] pb-3 mb-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you looking for?"
            className="w-full bg-transparent text-3xl md:text-5xl font-light text-white placeholder:text-gray-600 outline-none"
          />
        </div>
        <p className="text-sm text-gray-500 mb-10">
          Search by client name, mobile, email or booking reference
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-4">
              Upcoming appointments
            </h3>
            <p className="text-sm text-gray-500">None found</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-4">
              Clients (recently added)
            </h3>
            <div className="space-y-4">
              {SAMPLE_CLIENTS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="flex items-center gap-3 w-full hover:opacity-75 transition-opacity text-left">
                  <div className="w-10 h-10 rounded-full bg-[#3a4580] flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {c.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<NotifCategory>("Appointments");
  const filtered = SAMPLE_NOTIFICATIONS.filter((n) => n.category === category);
  if (!open) return null;
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex shadow-2xl"
        style={{ width: "min(780px, 100vw)" }}>
        <div className="hidden md:flex w-[260px] shrink-0 bg-[#111111] border-r border-[#1e1e1e] flex-col items-center justify-center px-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#222] flex items-center justify-center mb-4">
            <CalendarX2 size={30} className="text-gray-500" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">
            No scheduled team members
          </h3>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            Add availability to your team by managing your scheduled shifts
          </p>
          <div className="flex flex-col gap-2 w-full">
            <button
              type="button"
              className="w-full py-2.5 rounded-full bg-[#2a2a2a] text-sm font-semibold text-white hover:bg-[#333] transition-colors">
              Scheduled shifts
            </button>
            <button
              type="button"
              className="w-full py-2.5 rounded-full border border-[#3a3a3a] text-sm font-semibold text-white hover:bg-[#1a1a1a] transition-colors">
              View all team members
            </button>
          </div>
        </div>
        <div className="flex-1 bg-[#141414] flex flex-col overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-3 border-b border-[#1e1e1e] shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-[#333] flex items-center justify-center text-gray-400 hover:text-white hover:border-[#555] transition-colors shrink-0">
              <X size={14} />
            </button>
            <div className="flex gap-0.5 overflow-x-auto [scrollbar-width:none]">
              {NOTIF_CATEGORIES.map(({ label, icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setCategory(label)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors shrink-0",
                    category === label
                      ? "text-[#7b97ff] bg-[#1a2048]"
                      : "text-gray-500 hover:text-gray-200 hover:bg-[#1e1e1e]",
                  )}>
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-500 text-center mt-10">
                No notifications
              </p>
            ) : (
              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest px-1 mb-3">
                  Read
                </p>
                {filtered.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start gap-3 bg-[#1a1a1a] rounded-xl px-4 py-3.5 border border-[#222] cursor-pointer hover:bg-[#1e1e1e] transition-colors">
                    <div className="relative shrink-0">
                      <div className="w-9 h-9 rounded-full bg-[#3a4580] flex items-center justify-center text-sm font-bold text-white">
                        {n.initials}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full bg-[#4f63d2] border-2 border-[#141414] flex items-center justify-center">
                        <CalendarDays size={9} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-white leading-snug">
                          {n.title}
                        </p>
                        <span className="text-[11px] text-gray-500 shrink-0 mt-0.5">
                          {n.time}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        {n.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (session?.user?.isblocked) router.push("/blocked");
    if (session?.user?.category === "user") {
      const blocked = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
      if (blocked) router.push("/unauthorized");
    }
  }, [pathname, session, router]);

  const isBusiness = session?.user?.category === "business";
  const displayName =
    session?.user?.name ?? (session?.user as any)?.business_name ?? "User";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f3f4f6]">
      {/* Sidebar — always visible, fixed */}
      {isBusiness ? <Sidebar /> : <UserSidebar />}

      {/* Content — offset from sidebar */}
      <div className="ml-[48px] md:ml-[48px] flex flex-col min-h-screen">
        {isBusiness && (
          <header className="h-[56px] md:h-[60px] bg-[#111111] flex items-center justify-end px-4 md:px-5 sticky top-0 z-30 border-b border-[#1e1e1e]">
            {/* Mobile: empty left */}
            <div className="md:hidden" />
            <div className="flex items-center gap-0.5">
              <TopBarBtn onClick={() => setShowSearch(true)}>
                <Search size={17} />
              </TopBarBtn>
              <TopBarBtn onClick={() => {}}>
                <BarChart2 size={17} />
              </TopBarBtn>
              <div className="relative">
                <TopBarBtn onClick={() => setShowNotif(true)}>
                  <Bell size={17} />
                </TopBarBtn>
                <span className="absolute top-1 right-1 w-[15px] h-[15px] rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center border-2 border-[#111111] pointer-events-none">
                  3
                </span>
              </div>
              <TopBarBtn onClick={() => {}}>
                <MessageCircle size={17} />
              </TopBarBtn>
              <div className="relative ml-1">
                <button
                  type="button"
                  onClick={() => setShowProfile((p) => !p)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white hover:opacity-90 transition-opacity">
                  {initials}
                </button>
                {showProfile && (
                  <ProfileDropdown
                    name={displayName}
                    onClose={() => setShowProfile(false)}
                  />
                )}
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>

      {/* Overlays */}
      <SearchOverlay
        key={String(showSearch)}
        open={showSearch}
        onClose={() => setShowSearch(false)}
      />
      <NotificationDrawer
        open={showNotif}
        onClose={() => setShowNotif(false)}
      />
    </div>
  );
}
