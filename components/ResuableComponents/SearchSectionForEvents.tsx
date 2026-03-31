"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { useRouter, useSearchParams } from "next/navigation";

type SearchState = "where" | "when" | "search" | null;

export default function EventSearchWithDates({ sticky }: { sticky: boolean }) {
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

  return (
    <div className="flex  w-fit m-auto justify-center py-6" ref={containerRef}>
      <div
        className={`relative  flex items-center rounded-full border border-gray-200 transition-all duration-300 ${
          activeTab
            ? "bg-[#ebebeb] shadow-md"
            : "bg-white shadow-sm hover:shadow-md"
        }`}>
        <div
          className={`${sticky ? "w-32" : "w-52"} flex flex-col rounded-full py-3 px-8 cursor-pointer transition-all duration-200`}>
          <p className="uppercase tracking-wider text-[11px] mt-2 text-clip-1 truncate ">
            Search Events
          </p>
          <div className="flex w-full justify-between">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search Local Events"
              className="w-full py-2 text-xs border-none outline-none focus:ring-0 focus:outline-none  
             focus:border-none rounded-sm h-5 bg-transparent active:border-0"
              onClick={() => setActiveTab("search")}
            />
          </div>
        </div>
        {inputValue && (
          <X
            className="h-4 w-4 text-black cursor-pointer mr-2 hover:bg-black/10 backdrop-blur-md p-0.5 hover:shadow-lg  rounded-full  transition-all duration-200"
            onClick={() => setInputValue("")}
          />
        )}

        <Divider hide={activeTab === "where" || activeTab === "when"} />

        <SearchSection
          label="Where"
          value={location || "Select destinations"}
          isActive={activeTab === "where"}
          onClick={() => setActiveTab("where")}
          location={location}
          date={date}
          sticky={sticky}
          setLocation={setLocation}
          setInputValue={setInputValue}
          setDate={setDate}>
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
          onClick={() => setActiveTab("when")}
          setLocation={setLocation}
          setInputValue={setInputValue}
          sticky={sticky}
          setDate={setDate}>
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

        <div className="pr-2 ml-3">
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
      </div>
    </div>
  );
}

function SearchSection({
  label,
  value,
  isActive,
  onClick,
  setLocation,
  setDate,
  children,
  isLast,
  sticky,
  location,
  date,
}: any) {
  return (
    <div className="relative">
      <div
        onClick={onClick}
        className={`flex  flex-col rounded-full ${sticky ? "w-32" : "w-52"} py-3 px-8 cursor-pointer transition-all duration-200 ${
          isActive
            ? "bg-white shadow-xl scale-105 z-10"
            : "hover:bg-gray-200/60"
        }`}>
        <span className="text-[12px] font-extrabold text-gray-900">
          {label}
        </span>
        <span
          className={`text-sm flex gap-2 truncate max-w-[140px] font-medium ${isActive ? "text-black" : "text-gray-500"}`}>
          {value}
        </span>
      </div>
      {label === "When" && (
        <X
          className="absolute z-50 top-1/2 -translate-y-1/2 right-2 h-4 w-4 text-black 
               cursor-pointer hover:bg-black/10 backdrop-blur-md p-0.5 
               hover:shadow-lg rounded-full transition-all duration-200"
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();

            console.log("Clearing date..."); // Debugging
            setDate(undefined);
          }}
        />
      )}
      {label === "Where" && location && (
        <X
          className="absolute top-5.5 right-0 h-4 w-4 text-black 
        cursor-pointer mr-2 hover:bg-black/10 backdrop-blur-md p-0.5 
        hover:shadow-lg   rounded-full  transition-all duration-200"
          onClick={() => {
            if (label === "Where") {
              setLocation("");
            }
          }}
        />
      )}

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
