"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  MapPin,
  Calendar as CalendarIcon,
  Building,
  Tag,
  ArrowRight,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { useRouter, useSearchParams } from "next/navigation";

type SearchState = "where" | "when" | "search" | null;

export default function EventSearchWithDates() {
  const [activeTab, setActiveTab] = useState<SearchState>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [inputValue, setInputValue] = useState(
    searchParams.get("search") || "",
  );

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

  const handleSearch = () => {
    router.push(
      `/events?search=${inputValue}${date ? `&from=${date.from && format(date.from, "yyyy-MM-dd")}` : ""}${date?.to ? `&to=${format(date.to, "yyyy-MM-dd")}` : ""}${location ? `&city=${location}` : ""}`,
    );
  };

  const handleClearSearch = () => {
    setInputValue("");
    setLocation("");
    setDate(undefined);
    router.push("/events");
  };

  return (
    <div className="flex w-fit m-auto justify-center py-6" ref={containerRef}>
      <div
        className={`relative flex items-center rounded-full border border-gray-200 transition-all duration-300 ${
          activeTab
            ? "bg-[#ebebeb] shadow-md"
            : "bg-white shadow-sm hover:shadow-md"
        }`}>
        <SearchSection
          label="Search"
          value={inputValue || "Search Events"}
          isActive={activeTab === "search"}
          onClick={() => setActiveTab("search")}>
          <div className="w-[400px] p-8  ">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-wha-h6">
              Search Events
            </h3>
            <div className=" flex items-center flex-1 border border-slate-200  rounded-full px-3 py-2">
              <Search className=" text-slate-300" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search Local Events"
                className="w-full pl-10 pr-3 py-2 text-base border-none  focus:outline-none focus-within:ring-0"
              />
              <span
                className="bg-wha-primary text-white p-1 rounded-full"
                onClick={() => setActiveTab("where")}>
                <ArrowRight />
              </span>
            </div>
          </div>
        </SearchSection>

        <Divider hide={activeTab === "where" || activeTab === "when"} />

        <SearchSection
          label="Where"
          value={location || "Select destinations"}
          isActive={activeTab === "where"}
          onClick={() => setActiveTab("where")}>
          <div className="w-[400px] p-8">
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
                <span className="font-medium text-gray-700 text-wha-h6">
                  {city}, Australia
                </span>
              </div>
            ))}
          </div>
        </SearchSection>

        <Divider hide={activeTab === "when" || activeTab === "search"} />

        <SearchSection
          label="When"
          value={getDateDisplay()}
          isActive={activeTab === "when"}
          onClick={() => setActiveTab("when")}>
          <div className="p-4 bg-white rounded-3xl">
            <Calendar
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
              className="rounded-md border-none text-wha-h6"
            />
          </div>
        </SearchSection>

        <div className="pr-2">
          <button
            className={`flex items-center gap-2 rounded-full bg-[#051e3a] text-white transition-all duration-300 ${
              activeTab ? "px-6 py-4" : "p-4"
            }`}
            onClick={handleSearch}>
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
        <div className="pr-2">
          <button
            className={`flex items-center gap-2 rounded-full bg-[#051e3a] text-white transition-all duration-300 ${
              activeTab ? "px-6 py-4" : "p-4"
            }`}
            onClick={handleClearSearch}>
            <X className="h-4 w-4 stroke-[4px]" />
            <AnimatePresence>
              {activeTab && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="font-bold overflow-hidden whitespace-nowrap">
                  Clear Search
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
