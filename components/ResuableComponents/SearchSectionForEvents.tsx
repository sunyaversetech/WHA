"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, CalendarDays, ChevronRight, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  addDays,
  format,
  startOfMonth,
  endOfMonth,
  formatDate,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../ui/button";

type SearchState = "where" | "when" | "search" | null;

const FontImport = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Fraunces:ital,opsz,wght@1,9..144,300&display=swap');
    .esw-root, .esw-root * { font-family: 'DM Sans', sans-serif; }
    .esw-placeholder::placeholder {
      font-family: 'Fraunces', serif;
      font-style: italic;
      font-weight: 300;
      color: #9896aa;
    }
    .esw-seg:hover .esw-clear-show { opacity: 0.6; }
    .esw-seg.esw-active .esw-clear-show { opacity: 0.6; }
  `}</style>
);

export default function EventSearchWithDates({ sticky }: { sticky?: boolean }) {
  const [activeTab, setActiveTab] = useState<SearchState>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [location, setLocation] = useState("");
  const [inputValue, setInputValue] = useState(
    searchParams.get("search") || "",
  );
  const [date, setDate] = useState<DateRange | undefined>({
    from: undefined,
    to: undefined,
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
      if (date.to)
        return `${format(date.from, "MMM d")} – ${format(date.to, "MMM d")}`;
      return format(date.from, "MMM d");
    }
    return "";
  };
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

  const handleSearch = () => {
    router.push(
      `/events?search=${inputValue}` +
        `${date?.from ? `&from=${format(date.from, "yyyy-MM-dd")}` : ""}` +
        `${date?.to ? `&to=${format(date.to, "yyyy-MM-dd")}` : ""}` +
        `${location ? `&city=${location}` : ""}`,
    );
    setActiveTab(null);
  };

  const isExpanded = activeTab !== null;
  const segW = sticky ? "w-[130px]" : "w-[180px]";

  return (
    <>
      <FontImport />
      <div
        className="esw-root flex w-fit items-center justify-center m-auto"
        ref={containerRef}>
        <div
          className={[
            "relative flex items-center rounded-full p-1.5 overflow-visible transition-all duration-300",
            isExpanded
              ? "bg-[#f5f4f8] shadow-[0_8px_32px_rgba(15,14,23,0.10)] border border-transparent"
              : "bg-white shadow-[0_2px_8px_rgba(15,14,23,0.07)] border border-black/[0.07]",
          ].join(" ")}>
          <div
            onClick={() => setActiveTab("search")}
            className={[
              "relative flex flex-col justify-center rounded-full px-6 py-2.5 min-h-[60px] cursor-pointer transition-all duration-200",
              sticky ? "min-w-[130px]" : "min-w-[200px]",
              activeTab === "search"
                ? "bg-white shadow-[0_8px_32px_rgba(15,14,23,0.10)] scale-[1.02] z-10"
                : "hover:bg-[#eeecf5]",
            ].join(" ")}>
            <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#0f0e17] mb-1 leading-none select-none">
              Search Events
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Concerts, markets…"
                className="esw-placeholder flex-1 min-w-0 bg-transparent border-none outline-none ring-0 text-[13px] font-medium text-[#0f0e17] p-0 focus:ring-0 focus:outline-none"
              />
              <AnimatePresence>
                {inputValue && (
                  <motion.button
                    key="clr-search"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setInputValue("");
                    }}
                    className="flex items-center justify-center w-5 h-5 shrink-0 rounded-full opacity-50 hover:opacity-100 hover:bg-black/10 transition-all duration-150 border-none bg-transparent cursor-pointer">
                    <X size={11} strokeWidth={3} />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Divider hide={activeTab === "where" || activeTab === "search"} />

          <SegmentSection
            label="Where"
            isActive={activeTab === "where"}
            onClick={() => setActiveTab(activeTab === "where" ? null : "where")}
            displayValue={location}
            placeholder="Select destination"
            onClear={() => setLocation("")}
            segW={segW}>
            <div className="p-2 py-3">
              {[
                { city: "sydney", country: "Australia", emoji: "🌉" },
                { city: "canberra", country: "Australia", emoji: "🏛️" },
              ].map(({ city, country, emoji }) => (
                <motion.div
                  key={city}
                  whileHover={{ x: 2 }}
                  className="group flex items-center gap-3.5 rounded-2xl px-3.5 py-3 cursor-pointer hover:bg-[#f5f4f8] transition-colors duration-150 min-w-[280px]"
                  onClick={() => {
                    setLocation(city);
                    setActiveTab("when");
                  }}>
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#f5f4f8] shrink-0 group-hover:bg-[#ede8ff] transition-colors duration-150">
                    <span className="text-[18px] leading-none">{emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0f0e17] capitalize leading-tight">
                      {city}
                    </p>
                    <p className="text-xs text-[#9896aa] leading-tight mt-0.5">
                      {country}
                    </p>
                  </div>
                  <ChevronRight
                    size={14}
                    className="text-[#9896aa] group-hover:translate-x-0.5 transition-all"
                  />
                </motion.div>
              ))}
            </div>
          </SegmentSection>

          <Divider hide={activeTab === "when" || activeTab === "where"} />

          <SegmentSection
            label="When"
            isActive={activeTab === "when"}
            onClick={() => setActiveTab(activeTab === "when" ? null : "when")}
            displayValue={getDateDisplay()}
            placeholder="Add dates"
            onClear={() => setDate(undefined)}
            segW={segW}
            hasValue={!!date?.from}
            panelAlign="right">
            <div className="flex flex-row overflow-hidden pl-4">
              <div className="w-[190px] border-r border-black/5 p-4 flex flex-col gap-5 ">
                <div className="flex flex-col mt-7 gap-2  px-1"></div>
                {[
                  { label: "Today", id: "today" },
                  { label: "This Week", id: "week" },
                  { label: "This Month", id: "month" },
                ].map((btn) => (
                  <Button
                    variant={"outline"}
                    key={btn.id}
                    onClick={() => handleQuickSelect(btn.id as any)}
                    className={`w-full text-left items-start  px-4 py-2.5 rounded-xl text-[12px] font-semibold text-[#5a5872] hover:bg-[#6c47ff]/10 
                    hover:text-[#6c47ff] transition-all duration-200 border border-slate-300 cursor-pointer active:scale-[0.96] h-25 flex flex-col`}>
                    <span className="text-[18px] font-bold text-black">
                      {" "}
                      {btn.label}
                    </span>
                    <p>
                      {btn && btn.id === "week" ? (
                        <>
                          {`${formatDate(now, "dd")} - ${formatDate(addDays(now, 7), "dd")}`}
                        </>
                      ) : btn.id === "month" ? (
                        <>
                          {`${formatDate(startOfMonth(now), "dd")} - ${formatDate(endOfMonth(now), "dd")}`}
                        </>
                      ) : (
                        <>{`${formatDate(now, "dd")} `}</>
                      )}
                    </p>
                  </Button>
                ))}
              </div>

              <div className="p-5">
                <Calendar
                  mode="range"
                  defaultMonth={date?.from}
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={1}
                  className="rounded-md border-none z-49 bg-white p-4"
                  classNames={{
                    range_start:
                      "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                    range_end:
                      "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                    range_middle:
                      "aria-selected:bg-blue-100 aria-selected:text-blue-900",
                    selected:
                      "bg-blue-400/10! text-white hover:bg-white hover:text-white focus:bg-blue-500 focus:text-white",
                  }}
                />
              </div>
            </div>
          </SegmentSection>

          <button
            onClick={handleSearch}
            className="flex ml-2 items-center rounded-full bg-[#051e3a] text-white shrink-0 min-w-[48px] min-h-[48px] justify-center overflow-hidden 
            shadow-[0_4px_16px_rgba(5,30,58,0.35)] hover:bg-[#0b3463] transition-all duration-200 cursor-pointer border-none">
            <span className="flex items-center justify-center px-3.5">
              <Search size={16} strokeWidth={3} />
            </span>
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  key="search-label"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="pr-5 font-bold text-[13px] whitespace-nowrap overflow-hidden block">
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
  hasValue,
  panelAlign = "left",
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  displayValue: string;
  placeholder: string;
  onClear: () => void;
  children: React.ReactNode;
  segW: string;
  hasValue?: boolean;
  panelAlign?: "left" | "right";
}) {
  const [ripple, setRipple] = useState<{
    x: number;
    y: number;
    id: number;
  } | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: Date.now(),
    });
    onClick();
  };

  const isValuePresent = hasValue !== undefined ? hasValue : !!displayValue;

  return (
    <div className="relative">
      <div
        onClick={handleClick}
        className={[
          "esw-seg relative flex flex-col justify-center rounded-full px-6 py-2.5 min-h-[60px] cursor-pointer select-none overflow-hidden transition-all duration-200",
          segW,
          isActive
            ? "esw-active bg-white shadow-[0_8px_32px_rgba(15,14,23,0.10)] scale-[1.02] z-10"
            : "hover:bg-[#eeecf5]",
        ].join(" ")}>
        <AnimatePresence>
          {ripple && (
            <motion.span
              key={ripple.id}
              className="absolute w-16 h-16 -ml-8 -mt-8 rounded-full bg-[#6c47ff]/[0.15] pointer-events-none"
              style={{ left: ripple.x, top: ripple.y }}
              initial={{ scale: 0, opacity: 0.6 }}
              animate={{ scale: 5, opacity: 0 }}
              onAnimationComplete={() => setRipple(null)}
            />
          )}
        </AnimatePresence>

        <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#0f0e17] mb-1 leading-none">
          {label}
        </span>

        <span
          className={[
            "text-[13px] truncate max-w-[140px] leading-snug",
            isValuePresent
              ? isActive
                ? "text-[#0f0e17] font-medium"
                : "text-[#5a5872] font-medium"
              : "font-light italic text-[#9896aa]",
          ].join(" ")}
          style={
            !isValuePresent ? { fontFamily: "'Fraunces', serif" } : undefined
          }>
          {isValuePresent ? displayValue : placeholder}
        </span>

        {isValuePresent && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="esw-clear-show absolute top-1/2 -translate-y-1/2 right-2 flex items-center justify-center w-[18px] h-[18px] rounded-full opacity-0 hover:!opacity-100 hover:bg-black/10 transition-all duration-150 z-20 border-none bg-transparent cursor-pointer">
            <X size={10} strokeWidth={3} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            className={[
              "absolute top-[calc(100%+18px)] z-49 bg-white rounded-[2rem] overflow-hidden",
              "shadow-[0_20px_60px_rgba(15,14,23,0.13),0_0_0_1.5px_rgba(15,14,23,0.06)]",
              panelAlign === "right" ? "right-0" : "left-1/2 -translate-x-1/2",
            ].join(" ")}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.34, 1.1, 0.64, 1] }}>
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
