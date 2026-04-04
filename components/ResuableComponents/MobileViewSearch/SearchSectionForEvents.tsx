"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronRight, SearchIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { addDays, format, startOfMonth, endOfMonth } from "date-fns";
import { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";

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

export default function MobileEventSearchWithDates({
  sticky,
}: {
  sticky?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<SearchState>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [location, setLocation] = useState(searchParams.get("city") || "");
  const [open, setOpen] = useState(false);
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
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger className="w-11/12 flex my-2 m-auto">
        <div
          onClick={() => setActiveTab("search")}
          className="flex flex-col bg-white rounded-full gap-1.5 cursor-pointer w-full text-center items-center shadow-md py-2.5">
          <div className="flex items-center justify-center gap-1.5 py-1">
            <SearchIcon size={15} />
            <span className="text-[12px] font-medium  tracking-[0.08em] text-[#0f0e17]  leading-none select-none">
              Search events
            </span>
          </div>
        </div>
      </DrawerTrigger>
      <DrawerContent className="h-screen w-full bg-white flex  flex-col rounded-t-4xl! border-none z-999 shadow-none!">
        <DrawerHeader>
          <DrawerTitle>Search Events</DrawerTitle>
        </DrawerHeader>
        <FontImport />
        <div
          className="esw-root flex w-full md:w-fit   overflow-y-scroll h-full gap-2 px-4 md:px-0 no-scrollbar"
          ref={containerRef}>
          <div
            className={[
              "relative flex flex-col  gap-3  md:flex-row items-stretch md:items-center rounded-[1rem] md:rounded-full p-1.5 transition-all duration-300 w-full",
              isExpanded ? "  " : "bg-white  ",
            ].join(" ")}>
            <div
              onClick={() => setActiveTab("search")}
              className={[
                "relative flex flex-col justify-center max-md:w-full rounded-md px-6 py-2.5 bg-slate-100/80 min-h-[60px] cursor-pointer transition-all duration-200",
                segW,
                activeTab === "search"
                  ? "bg-white shadow-md scale-[1.02] z-10"
                  : "hover:bg-[#eeecf5]",
              ].join(" ")}>
              <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#0f0e17] mb-1 leading-none select-none">
                Search Events
              </span>
              <div className="flex items-center gap-1.5 border px-1 rounded-sm">
                <SearchIcon size={15} />
                <Input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Concerts, markets…"
                  className="esw-placeholder flex-1 min-w-0 bg-transparent shadow-none border-none focus:outline-none  focus-visible:ring-0 outline-none text-base font-medium text-[#0f0e17] p-0 focus:ring-0"
                />
                {inputValue && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInputValue("");
                    }}
                    className="opacity-50 hover:opacity-100">
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            <SegmentSection
              label="Where"
              isActive={activeTab === "where"}
              onClick={() =>
                setActiveTab(activeTab === "where" ? null : "where")
              }
              displayValue={location}
              placeholder="Select destination"
              onClear={() => setLocation("")}
              segW={segW}>
              <div className="p-2 py-3 -mt-1 w-full md:min-w-[300px]">
                {[
                  { city: "sydney", country: "Australia", emoji: "🌉" },
                  { city: "canberra", country: "Australia", emoji: "🏛️" },
                ].map(({ city, country, emoji }) => (
                  <div
                    key={city}
                    className="flex items-center gap-3.5 rounded-2xl w-[90vw] px-3.5 py-3 cursor-pointer hover:bg-[#f5f4f8]"
                    onClick={() => {
                      setLocation(city);
                      setActiveTab("when");
                    }}>
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-xl">
                      {emoji}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold capitalize">{city}</p>
                      <p className="text-xs text-gray-500">{country}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-400" />
                  </div>
                ))}
              </div>
            </SegmentSection>

            <CalendarSegment
              date={date}
              setDate={setDate}
              isActive={activeTab === "when"}
              onClick={() => setActiveTab(activeTab === "when" ? null : "when")}
              onClear={() => setDate(undefined)}
              segW="w-full"
            />
          </div>
        </div>
        <button
          onClick={() => {
            handleSearch();
            setActiveTab(null);
            setOpen(false);
          }}
          className="flex w-[92vw] mb-4 m-auto mt-2 md:mt-0 md:ml-2 items-center rounded-full bg-[#051e3a] text-white shrink-0 min-h-[56px] 
          md:min-h-[48px] justify-center shadow-lg hover:bg-[#0b3463] transition-all  md:w-auto md:px-2">
          <Search size={18} className="md:mx-2" />
          <span className="md:hidden font-bold text-[15px] ml-2">
            Search Events
          </span>
          <AnimatePresence>
            {isExpanded && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="hidden md:block pr-4 font-bold text-[13px] whitespace-nowrap">
                Search
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </DrawerContent>
    </Drawer>
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
          "esw-seg relative flex flex-col bg-slate-100/80 justify-center rounded-md max-md:w-full px-6 py-2.5 min-h-[60px] cursor-pointer select-none overflow-hidden transition-all duration-200",
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
            className="esw-clear-show absolute top-1/2 -translate-y-1/2 right-4 flex items-center justify-center w-[18px] h-[18px] rounded-full opacity-0 hover:!opacity-100 hover:bg-black/10 transition-all duration-150 z-20 border-none bg-transparent cursor-pointer">
            <X size={14} strokeWidth={3} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            className={[
              "absolute top-[calc(100%+11px)] z-49 bg-white rounded-md overflow-hidden",
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

interface CalendarSegmentProps {
  date: DateRange | undefined;
  setDate: (date: DateRange | undefined) => void;
  isActive: boolean;
  onClick: () => void;
  onClear: () => void;
  segW: string;
}

export function CalendarSegment({
  date,
  setDate,
  isActive,
  onClick,
  onClear,
  segW,
}: CalendarSegmentProps) {
  const [ripple, setRipple] = useState<{
    x: number;
    y: number;
    id: number;
  } | null>(null);

  const getDateDisplay = () => {
    if (date?.from) {
      if (date.to)
        return `${format(date.from, "MMM d")} – ${format(date.to, "MMM d")}`;
      return format(date.from, "MMM d");
    }
    return "Add dates";
  };

  const handleQuickSelect = (type: "today" | "week" | "month") => {
    const now = new Date();
    if (type === "today") setDate({ from: now, to: now });
    else if (type === "week") setDate({ from: now, to: addDays(now, 7) });
    else if (type === "month")
      setDate({ from: startOfMonth(now), to: endOfMonth(now) });
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      id: Date.now(),
    });
    onClick();
  };

  const hasValue = !!date?.from;

  return (
    <div className="relative w-full md:w-auto">
      <div
        onClick={handleClick}
        className={[
          "esw-seg relative flex flex-col bg-slate-100/80 justify-center rounded-md px-6 py-2.5 min-h-[60px] cursor-pointer select-none overflow-hidden transition-all duration-200",
          segW,
          isActive
            ? "bg-white shadow-md scale-[1.02] z-10"
            : "hover:bg-[#eeecf5]",
        ].join(" ")}>
        <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#0f0e17] mb-1 leading-none">
          When
        </span>
        <span
          className={[
            "text-[13px] truncate leading-snug",
            hasValue
              ? "text-[#0f0e17] font-medium"
              : "font-light italic text-[#9896aa]",
          ].join(" ")}>
          {getDateDisplay()}
        </span>

        {hasValue && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center justify-center w-[18px] h-[18px] rounded-full hover:bg-black/10 transition-all">
            <X size={14} strokeWidth={3} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isActive && (
          <motion.div
            className="mt-2 md:mt-0 md:absolute md:top-[calc(100%+18px)] md:right-0 z-[60] bg-white rounded-sm w-[91vw] md:rounded-[2rem] 
            overflow-hidden  md:w-auto md:shadow-xl border md:border-black/5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}>
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-[140px] border-b mt-1 md:border-b-0 md:border-r border-black/5 p-3 flex flex-row md:flex-col gap-2 overflow-x-auto">
                {["today", "week", "month"].map((id) => (
                  <Button
                    key={id}
                    variant="ghost"
                    onClick={() => handleQuickSelect(id as any)}
                    className="flex-1 md:w-full border-gray-200! rounded-sm! text-xs font-bold capitalize text-center justify-center btn-wha-outline hover:bg-[#f5f4f8]">
                    {id}
                  </Button>
                ))}
              </div>

              <div className="p-2 pt-0 md:p-4 flex justify-center bg-white">
                <Calendar
                  mode="range"
                  selected={date}
                  onSelect={setDate}
                  numberOfMonths={1}
                  className="rounded-sm bg-white w-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
