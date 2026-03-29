"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  MapPin,
  Calendar as CalendarIcon,
  Building,
  Tag,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";

type SearchState = "where" | "when" | "what" | null;

export default function AirbnbSearchWithDates() {
  const [activeTab, setActiveTab] = useState<SearchState>(null);
  const [location, setLocation] = useState("");
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const [what, setWhat] = useState("");

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setActiveTab(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getDateDisplay = () => {
    if (date?.from) {
      if (date.to) {
        return `${format(date.from, "MMM d")} – ${format(date.to, "MMM d")}`;
      }
      return format(date.from, "MMM d");
    }
    return "Add dates";
  };

  return (
    <div className="flex justify-center py-6" ref={containerRef}>
      <div
        className={`relative flex items-center rounded-full border border-gray-200 transition-all duration-300 ${
          activeTab
            ? "bg-[#ebebeb] shadow-md"
            : "bg-white shadow-sm hover:shadow-md"
        }`}>
        <SearchSection
          label="Where"
          value={location || "Search destinations"}
          isActive={activeTab === "where"}
          onClick={() => setActiveTab("where")}>
          <div className="w-[400px] p-8">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider">
              Recent searches
            </h3>
            {["sydney", "canberra"].map((city) => (
              <div
                key={city}
                onClick={() => {
                  setLocation(city);
                  setActiveTab("when");
                }}
                className="flex items-center gap-4 rounded-xl p-3 hover:bg-gray-100 cursor-pointer transition">
                <div className="rounded-lg bg-gray-200 p-3">
                  <MapPin className="h-5 w-5" />
                </div>
                <span className="font-medium text-gray-700">
                  {city}, Australia
                </span>
              </div>
            ))}
          </div>
        </SearchSection>

        <Divider hide={activeTab === "where" || activeTab === "when"} />

        <SearchSection
          label="When"
          value={getDateDisplay()}
          isActive={activeTab === "when"}
          onClick={() => setActiveTab("when")}>
          <div className="p-4 bg-white rounded-3xl">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              className="rounded-md border-none"
            />
          </div>
        </SearchSection>

        <Divider hide={activeTab === "when" || activeTab === "what"} />

        <SearchSection
          label="what"
          value={what ? what : "Add What"}
          isActive={activeTab === "what"}
          onClick={() => setActiveTab("what")}
          isLast>
          <div className="w-[380px] p-8 space-y-6">
            {["events", "businesses", "deals"].map((city) => (
              <div
                key={city}
                onClick={() => {
                  setWhat(city);
                }}
                className="flex items-center gap-4 rounded-xl p-3 hover:bg-gray-100 cursor-pointer transition">
                <div className="rounded-lg bg-gray-200 p-3">
                  {city === "events" ? (
                    <CalendarIcon className="h-5 w-5" />
                  ) : city === "businesses" ? (
                    <Building className="h-5 w-5" />
                  ) : (
                    <Tag className="h-5 w-5" />
                  )}
                </div>
                <span className="font-medium text-gray-700 capitalize">
                  {city}
                </span>
              </div>
            ))}
          </div>
        </SearchSection>

        <div className="pr-2">
          <button
            className={`flex items-center gap-2 rounded-full bg-[#051e3a] text-white transition-all duration-300 ${
              activeTab ? "px-6 py-4" : "p-4"
            }`}>
            <Search className="h-4 w-4 stroke-[4px]" />
            <AnimatePresence>
              {activeTab && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold overflow-hidden whitespace-nowrap">
                  Search
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </div>
  );
}

function SearchSection({
  label,
  value,
  isActive,
  onClick,
  children,
  isLast,
}: any) {
  return (
    <div className="relative">
      <div
        onClick={onClick}
        className={`flex flex-col rounded-full py-3 px-8 cursor-pointer transition-all duration-200 ${
          isActive
            ? "bg-white shadow-xl scale-105 z-10"
            : "hover:bg-gray-200/60"
        }`}>
        <span className="text-[12px] font-extrabold text-gray-900">
          {label}
        </span>
        <span
          className={`text-sm truncate max-w-[140px] font-medium ${isActive ? "text-black" : "text-gray-500"}`}>
          {value}
        </span>
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 20 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className={`absolute top-full z-[100] bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 ${
              isLast ? "right-0" : "left-[-50%]"
            }`}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Divider({ hide }: { hide: boolean }) {
  return (
    <div
      className={`h-8 w-[1px] bg-gray-300 transition-opacity ${hide ? "opacity-0" : "opacity-100"}`}
    />
  );
}
