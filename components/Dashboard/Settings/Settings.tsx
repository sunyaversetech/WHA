"use client";

import { useState } from "react";
import {
  User,
  Clock,
  MapPin,
  Images,
  Building2,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { BusinessHoursForm } from "./OperatingHours";
import { ABNUpdateForm } from "./UpdateABN";
import BusinessType from "./BusinessType";
import ProfileSettings from "./ProfileSettings";
import LocationSettings from "./LocationSettings";
import VenueImagesSettings from "./VenueImagesSettings";
import PortfolioSettings from "./PortfolioSettings";

const TABS = [
  {
    id: "profile",
    label: "Profile",
    icon: User,
    desc: "Photo, email, phone & community",
  },
  {
    id: "schedule",
    label: "Schedule",
    icon: Clock,
    desc: "Opening hours & 24/7 settings",
  },
  {
    id: "location",
    label: "Location",
    icon: MapPin,
    desc: "Address, map & coordinates",
  },
  {
    id: "venue",
    label: "Venue Photos",
    icon: Images,
    desc: "Upload & manage venue photos",
  },
  {
    id: "business",
    label: "Business Info",
    icon: Building2,
    desc: "ABN number & booking type",
  },
  {
    id: "portfolio",
    label: "Portfolio",
    icon: Briefcase,
    desc: "Work samples & project photos",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Settings() {
  const [active, setActive] = useState<TabId>("profile");

  return (
    <div className="min-h-screen max-w-7xl mx-auto">
      <div className="">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#051e3a]">
            Business Settings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your business profile, schedule, location and more.
          </p>
        </div>

        <div className="flex gap-6 items-start">
          <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Settings
              </p>
            </div>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3.5 text-left w-full transition-colors border-l-[3px]",
                    isActive
                      ? "border-[#051e3a] bg-[#051e3a]/5"
                      : "border-transparent hover:bg-gray-50",
                  )}>
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      isActive
                        ? "bg-[#051e3a] text-white"
                        : "bg-gray-100 text-gray-500",
                    )}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        isActive ? "text-[#051e3a]" : "text-gray-700",
                      )}>
                      {tab.label}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{tab.desc}</p>
                  </div>
                  {isActive && (
                    <ChevronRight
                      size={14}
                      className="text-[#051e3a] shrink-0"
                    />
                  )}
                </button>
              );
            })}
          </aside>

          <div className="flex-1 min-w-0 space-y-4">
            {/* ── MOBILE TABS ── */}
            <div className="md:hidden flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = active === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActive(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap border transition-colors shrink-0",
                      isActive
                        ? "bg-[#051e3a] text-white border-[#051e3a]"
                        : "bg-white text-gray-600 border-gray-200",
                    )}>
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* ── CONTENT PANEL ── */}
            {active === "profile" && <ProfileSettings />}
            {active === "schedule" && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-[#051e3a]">
                    Operating Hours
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Set your weekly opening schedule or mark as 24/7.
                  </p>
                </div>
                <BusinessHoursForm />
              </div>
            )}
            {active === "location" && <LocationSettings />}
            {active === "venue" && <VenueImagesSettings />}
            {active === "portfolio" && <PortfolioSettings />}
            {active === "business" && (
              <div className="space-y-6">
                <ABNUpdateForm />
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="mb-5">
                    <h3 className="text-base font-semibold text-[#051e3a]">
                      Booking Model
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Determines whether customers book staff time or physical
                      items.
                    </p>
                  </div>
                  <BusinessType />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
