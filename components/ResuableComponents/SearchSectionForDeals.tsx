"use client";

import { useState, useRef, useEffect } from "react";
import { Search, MapPin, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  addDays,
  endOfMonth,
  format,
  formatDate,
  startOfMonth,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";

type SearchState = "where" | "when" | "search" | null;

// --- STYLING CONSTANTS ---
const FontImport = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@1,9..144,300&display=swap');
    .ds-root, .ds-root * { font-family: 'DM Sans', sans-serif; }
    .ds-placeholder::placeholder {
      font-family: 'Fraunces', serif;
      font-style: italic;
      font-weight: 300;
      color: #9896aa;
    }
    .ds-seg:hover .ds-clear-show { opacity: 0.6; }
    .ds-seg.ds-active .ds-clear-show { opacity: 0.6; }
  `}</style>
);

export default function DealsSearchWithDates({ sticky }: { sticky?: boolean }) {
  const [activeTab, setActiveTab] = useState<SearchState>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [location, setLocation] = useState(searchParams.get("city") || "");
  const [inputValue, setInputValue] = useState(
    searchParams.get("search") || "",
  );
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
  });

  const now = new Date();

  const handleQuickSelect = (type: "today" | "week" | "month") => {
    if (type === "today") {
      setDate({ from: now, to: now });
    } else if (type === "week") {
      setDate({ from: now, to: addDays(now, 7) });
    } else if (type === "month") {
      setDate({ from: startOfMonth(now), to: endOfMonth(now) });
    }
  };

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
      if (date.to)
        return `${format(date.from, "MMM d")} – ${format(date.to, "MMM d")}`;
      return format(date.from, "MMM d");
    }
    return "";
  };

  const handleSearch = () => {
    const fromStr = date?.from
      ? `&from=${format(date.from, "yyyy-MM-dd")}`
      : "";
    const toStr = date?.to ? `&to=${format(date.to, "yyyy-MM-dd")}` : "";
    const locStr = location ? `&city=${location}` : "";

    router.push(`/deals?search=${inputValue}${fromStr}${toStr}${locStr}`);
    setActiveTab(null);
  };

  const isExpanded = activeTab !== null;
  const segW = sticky ? "w-[130px]" : "w-[180px]";

  return (
    <>
      <FontImport />
      <div
        className="ds-root flex w-full md:w-fit items-center justify-center m-auto px-4 md:px-0"
        ref={containerRef}
      >
        <div
          className={[
            "relative flex flex-col md:flex-row items-stretch md:items-center rounded-[2rem] md:rounded-full p-1.5 transition-all duration-300 w-full md:w-auto",
            isExpanded
              ? "bg-[#f5f4f8] shadow-[0_8px_32px_rgba(15,14,23,0.10)] border border-transparent"
              : "bg-white shadow-[0_2px_8px_rgba(15,14,23,0.07)] border border-black/[0.07]",
          ].join(" ")}
        >
          {/* SEARCH INPUT */}
          <div className="relative w-full md:w-auto">
            <div
              onClick={() => setActiveTab("search")}
              className={[
                "ds-seg relative flex flex-col justify-center rounded-full px-7 py-2.5 min-h-[60px] cursor-pointer transition-all duration-200",
                sticky ? "md:w-[130px]" : "md:w-[190px]",
                activeTab === "search"
                  ? "bg-white shadow-md scale-[1.02] z-10"
                  : "hover:bg-[#eeecf5]",
              ].join(" ")}
            >
              <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#0f0e17] mb-0.5 leading-none">
                Search Deals
              </span>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search local events"
                className="ds-placeholder w-full bg-transparent border-none outline-none text-[13px] text-[#0f0e17] p-0 font-medium h-5 focus:ring-0"
              />
              {/* ... clear button ... */}
            </div>
          </div>

          <Divider hide={activeTab === "search" || activeTab === "where"} />

          {/* WHERE SEGMENT */}
          <SegmentSection
            label="Where"
            isActive={activeTab === "where"}
            onClick={() => setActiveTab("where")}
            displayValue={location}
            placeholder="Select destinations"
            onClear={() => setLocation("")}
            segW={segW}
          >
            <div className="p-2 py-3 w-full md:min-w-[300px]">
              {["Sydney", "Canberra"].map((city) => (
                <motion.div
                  key={city}
                  whileHover={{ x: 2 }}
                  className="group flex items-center gap-3.5 rounded-2xl px-3.5 py-3 cursor-pointer hover:bg-[#f5f4f8] transition-colors"
                  onClick={() => {
                    setLocation(city);
                    setActiveTab("when");
                  }}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#f5f4f8] group-hover:bg-[#ede8ff] transition-colors">
                    <MapPin size={18} className="text-[#6c47ff]" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-semibold text-[#0f0e17] capitalize">
                      {city}
                    </p>
                    <p className="text-xs text-[#9896aa]">Australia</p>
                  </div>
                  <ChevronRight size={14} className="text-[#9896aa]" />
                </motion.div>
              ))}
            </div>
          </SegmentSection>

          <Divider hide={activeTab === "where" || activeTab === "when"} />

          {/* WHEN SEGMENT */}
          <SegmentSection
            label="When"
            isActive={activeTab === "when"}
            onClick={() => setActiveTab(activeTab === "when" ? null : "when")}
            displayValue={getDateDisplay()}
            placeholder="Add dates"
            onClear={() => setDate(undefined)}
            segW={segW}
            panelAlign="right"
          >
            <div className="flex flex-col md:flex-row overflow-y-auto md:overflow-hidden max-h-[70vh] md:max-h-none">
              {/* Quick Select Sidebar */}
              <div className="w-full md:w-[190px] border-b md:border-b-0 md:border-r border-black/5 p-4 flex flex-row md:flex-col gap-2 md:gap-5 overflow-x-auto md:overflow-x-visible">
                {[
                  { label: "Today", id: "today" },
                  { label: "This Week", id: "week" },
                  { label: "This Month", id: "month" },
                ].map((btn) => (
                  <Button
                    variant={"outline"}
                    key={btn.id}
                    onClick={() => handleQuickSelect(btn.id as any)}
                    className="flex-1 md:w-full text-left items-start px-4 py-2 rounded-xl h-auto flex flex-col min-w-[100px]"
                  >
                    <span className="text-[14px] md:text-[18px] font-bold text-black">
                      {btn.label}
                    </span>
                    <p className="text-[10px] hidden md:block">
                      {/* ... existing date formatting logic ... */}
                    </p>
                  </Button>
                ))}
              </div>

              {/* Calendar Area */}
              <div className="p-2 md:p-5 flex justify-center">
                <Calendar
                  mode="range"
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={1}
                  className="bg-white"
                />
              </div>
            </div>
          </SegmentSection>

          {/* SEARCH BUTTON */}
          <button
            onClick={handleSearch}
            className="flex mt-2 md:mt-0 md:ml-2 items-center rounded-full bg-[#051e3a] text-white shrink-0 min-h-[56px] md:min-h-[48px] justify-center shadow-[0_4px_16px_rgba(5,30,58,0.35)] hover:bg-[#0b3463] transition-all cursor-pointer border-none w-full md:w-auto md:min-w-[48px]"
          >
            <span className="flex items-center justify-center px-3.5">
              <Search size={18} strokeWidth={3} />
            </span>
            <span className="md:hidden font-bold text-[15px]">
              Search Deals
            </span>
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="hidden md:block pr-5 font-bold text-[13px] whitespace-nowrap overflow-hidden"
                >
                  Search
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>
    </>
  );
}

function SegmentSection({
  label,
  isActive,
  onClick,
  displayValue,
  placeholder,
  onClear,
  children,
  segW,
  panelAlign = "left",
}: any) {
  const hasValue = !!displayValue;
  return (
    <div className="relative">
      <div
        onClick={onClick}
        className={[
          "ds-seg relative flex flex-col justify-center max-sm:w-full rounded-full px-7 py-2.5 min-h-[60px] cursor-pointer select-none transition-all duration-200",
          segW,
          isActive
            ? "ds-active bg-white shadow-md scale-[1.02] z-10"
            : "hover:bg-[#eeecf5]",
        ].join(" ")}
      >
        <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#0f0e17] mb-1 leading-none">
          {label}
        </span>
        <span
          className={[
            "text-[13px] truncate max-w-[140px] leading-snug",
            hasValue
              ? "text-[#0f0e17] font-medium"
              : "font-light italic text-[#9896aa]",
          ].join(" ")}
          style={!hasValue ? { fontFamily: "'Fraunces', serif" } : undefined}
        >
          {hasValue ? displayValue : placeholder}
        </span>
        {hasValue && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="ds-clear-show absolute top-1/2 -translate-y-1/2 right-2 flex items-center justify-center w-[18px] h-[18px] rounded-full opacity-0 hover:!opacity-100 hover:bg-black/10 transition-all z-20 border-none bg-transparent cursor-pointer"
          >
            <X size={10} strokeWidth={3} />
          </button>
        )}
      </div>
      <AnimatePresence>
        {isActive && (
          <motion.div
            className={[
              "absolute top-[calc(100%+18px)] z-[100] bg-white rounded-[2rem] overflow-hidden",
              "shadow-[0_20px_60px_rgba(15,14,23,0.13),0_0_0_1.5px_rgba(15,14,23,0.06)]",
              panelAlign === "right" ? "right-0" : "left-1/2 -translate-x-1/2",
            ].join(" ")}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.34, 1.1, 0.64, 1] }}
          >
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
      className={[
        "w-px h-7 bg-black/10 mx-0.5 shrink-0 rounded-full transition-opacity duration-200",
        hide ? "opacity-0" : "opacity-100",
      ].join(" ")}
    />
  );
}
