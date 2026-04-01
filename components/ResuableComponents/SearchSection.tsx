"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  MapPin,
  Calendar as CalendarIcon,
  Building,
  Tag,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";

type SearchState = "where" | "when" | "what" | null;

export default function HomePageSearchWithDates({
  sticky,
}: {
  sticky?: boolean;
}) {
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
    <div
      className="flex w-fit m-auto justify-center py-8 z-[9999]"
      ref={containerRef}>
      <motion.div
        layout
        className={`relative flex items-center p-2 rounded-full border z-[9999] border-gray-200/80 transition-all duration-500 ${
          activeTab
            ? "bg-gray-100/80 backdrop-blur-xl shadow-2xl"
            : "bg-white shadow-lg hover:shadow-xl hover:border-gray-300"
        }`}>
        {/* WHERE SECTION */}
        <SearchSection
          label="Where"
          value={location || "Search destinations"}
          isActive={activeTab === "where"}
          onClick={() => setActiveTab("where")}
          sticky={sticky}
          onClear={() => setLocation("")}
          showClear={!!location}>
          <div className="w-[320px] p-3">
            <p className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Recent searches
            </p>
            {["Sydney", "Canberra"].map((city) => (
              <motion.div
                whileHover={{ x: 5 }}
                key={city}
                onClick={() => {
                  setLocation(city);
                  setActiveTab("when");
                }}
                className="flex items-center gap-4 rounded-2xl p-3 hover:bg-blue-50/50 cursor-pointer transition-all group">
                <div className="rounded-xl bg-gray-100 p-2.5 group-hover:bg-blue-100 transition-colors">
                  <MapPin className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                </div>
                <span className="font-semibold text-gray-700">
                  {city}, Australia
                </span>
              </motion.div>
            ))}
          </div>
        </SearchSection>

        <Divider hide={activeTab === "where" || activeTab === "when"} />

        {/* WHEN SECTION */}
        <SearchSection
          label="When"
          value={getDateDisplay()}
          isActive={activeTab === "when"}
          onClick={() => setActiveTab("when")}
          sticky={sticky}
          onClear={() => setDate(undefined)}
          showClear={!!date?.from}>
          <div className="p-6 bg-white rounded-3xl">
            <Calendar
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

        {/* WHAT SECTION */}
        <SearchSection
          label="What"
          value={what || "Add category"}
          isActive={activeTab === "what"}
          onClick={() => setActiveTab("what")}
          sticky={sticky}
          isLast
          onClear={() => setWhat("")}
          showClear={!!what}>
          <div className="w-[320px] p-3">
            <p className="px-4 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
              Browse Categories
            </p>
            {["events", "businesses", "deals"].map((item) => (
              <motion.div
                whileHover={{ x: 5 }}
                key={item}
                onClick={() => {
                  setWhat(item);
                  setActiveTab(null); // Close on select
                }}
                className="flex items-center gap-4 rounded-2xl p-3 hover:bg-blue-50/50 cursor-pointer transition-all group">
                <div className="rounded-xl bg-gray-100 p-2.5 group-hover:bg-blue-100 transition-colors">
                  {item === "events" ? (
                    <CalendarIcon className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                  ) : item === "businesses" ? (
                    <Building className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                  ) : (
                    <Tag className="h-5 w-5 text-gray-600 group-hover:text-blue-600" />
                  )}
                </div>
                <span className="font-semibold text-gray-700 capitalize">
                  {item}
                </span>
              </motion.div>
            ))}
          </div>
        </SearchSection>

        {/* SEARCH BUTTON */}
        <div className="pl-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex items-center justify-center gap-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 transition-all duration-300 ${
              activeTab ? "px-8 py-4" : "p-4"
            }`}>
            <Search className="h-5 w-5 stroke-[3px]" />
            <AnimatePresence>
              {activeTab && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold text-sm tracking-tight overflow-hidden whitespace-nowrap">
                  Search
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>
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
  sticky,
  onClear,
  showClear,
}: any) {
  return (
    <div className="relative">
      <div
        onClick={onClick}
        className={`flex flex-col justify-center rounded-full transition-all duration-300 cursor-pointer ${
          sticky ? "w-36" : "w-52"
        } py-3 px-8 ${
          isActive
            ? "bg-white shadow-md scale-[1.02] z-10"
            : "hover:bg-gray-200/40"
        }`}>
        <span className="uppercase tracking-[0.1em] text-[10px] font-bold text-gray-400 mb-0.5">
          {label}
        </span>
        <div className="flex items-center justify-between gap-1 overflow-hidden">
          <span
            className={`text-sm font-semibold truncate ${
              isActive ? "text-blue-600" : "text-gray-700"
            }`}>
            {value}
          </span>
          {showClear && isActive && (
            <X
              className="h-3.5 w-3.5 text-gray-400 hover:text-black shrink-0 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 12, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className={`absolute top-full z-[100] bg-white/95 backdrop-blur-md rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden ${
              isLast ? "right-0" : "left-1/2 -translate-x-1/2"
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
      className={`h-10 w-[1px] bg-gray-200 self-center transition-opacity duration-300 ${
        hide ? "opacity-0" : "opacity-100"
      }`}
    />
  );
}
