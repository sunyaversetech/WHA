"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import BookingWizard from "./BookingWizard";
import BookingList from "./BookingList";
import { Calendar, ClipboardList } from "lucide-react";

type TabType = "book" | "list";

export default function BookingsContainer() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>("book");

  useEffect(() => {
    // If a business is preselected or we are redirected for a new booking, show the booking tab.
    // If the URL has an explicit tab query, we can respect that as well.
    const urlTab = searchParams.get("tab") as TabType | null;
    const businessId = searchParams.get("business_id");

    if (urlTab === "book" || urlTab === "list") {
      setActiveTab(urlTab);
    } else if (businessId) {
      setActiveTab("book");
    } else {
      setActiveTab("list"); // Default to list for regular visits to /bookings
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-[#f8fafc] pb-20 pt-24">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Tab Controls */}
        <div className="flex justify-center mb-8">
          <div className="bg-white p-1.5 rounded-full shadow-md border border-slate-200 flex gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("list")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === "list"
                  ? "bg-[#051e3a] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              <ClipboardList className="w-4 h-4" /> My Appointments
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("book")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === "book"
                  ? "bg-[#051e3a] text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 bg-transparent"
              }`}
            >
              <Calendar className="w-4 h-4" /> Book a Treatment
            </button>
          </div>
        </div>

        {/* Tab Content Panels */}
        <div className="transition-all duration-300">
          {activeTab === "book" ? (
            <BookingWizard />
          ) : (
            <BookingList />
          )}
        </div>
      </div>
    </main>
  );
}
