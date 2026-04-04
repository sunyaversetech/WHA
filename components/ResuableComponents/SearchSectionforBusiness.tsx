"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  X,
  MapPin,
  ChevronRight,
  Store,
  Car,
  Scissors,
  Coffee,
  Eraser,
  Briefcase,
  Zap,
  Truck,
  Calendar,
  ShoppingBasket,
  Paintbrush,
  Camera,
  Pipette,
  Move,
  Utensils,
  Sparkles,
  ShoppingBag,
  Users,
  Plane,
  MoreHorizontal,
} from "lucide-react";
import { useGetALLBusiness } from "@/services/business.service";

type SearchState = "where" | "cat" | "search" | null;

const FontImport = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@1,9..144,300&display=swap');
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

export const CATEGORY_ICONS: Record<string, any> = {
  all: Store,
  automotive: Car,
  barber: Scissors,
  cafe: Coffee,
  cleaning: Eraser,
  consultancy: Briefcase,
  "driving school": Car,
  electrician: Zap,
  "event-organizer": Calendar,
  "food truck": Truck,
  grocery: ShoppingBasket,
  painter: Paintbrush,
  photography: Camera,
  plumber: Pipette,
  pujari: Users,
  event: Calendar,
  removalists: Move,
  cafes: Coffee,
  restaurant: Utensils,
  "saloon and makeup": Sparkles,
  shop: ShoppingBag,
  "social club": Users,
  "travel and tours": Plane,
  others: MoreHorizontal,
};

export default function BusinessSearchWithDates({
  sticky,
}: {
  sticky?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<SearchState>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const { data } = useGetALLBusiness();
  const [location, setLocation] = useState(searchParams.get("city") || "");
  const [inputValue, setInputValue] = useState(
    searchParams.get("search") || "",
  );
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "all",
  );
  const [categories, setCategories] = useState<string[]>([]);
  const discoveredCategories = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (data?.data) {
      data.data.forEach((item: any) => {
        if (item.business_category)
          discoveredCategories.current.add(item.business_category);
      });
      setCategories(Array.from(discoveredCategories.current));
    }
  }, [data?.data]);

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

  const CATEGORIES = useMemo(() => {
    const base = [{ name: "All", value: "all", icon: Store }];
    const dynamic = categories.map((cat) => ({
      name: cat,
      value: cat,
      icon: CATEGORY_ICONS[cat.toLowerCase()] || Store,
    }));
    return [...base, ...dynamic];
  }, [categories]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (inputValue) params.set("search", inputValue);
    if (activeCategory !== "all") params.set("category", activeCategory);
    if (location) params.set("city", location);
    router.push(`/businesses?${params.toString()}`);
    setActiveTab(null);
  };

  const isExpanded = activeTab !== null;
  const segW = sticky ? "w-[130px]" : "w-[180px]";

  return (
    <>
      <FontImport />
      <div
        className="esw-root flex w-full md:w-fit items-center justify-center m-auto py-4 md:py-6 md:pt-0 px-4 md:px-0"
        ref={containerRef}>
        <div
          className={[
            "relative flex flex-col md:flex-row items-stretch md:items-center rounded-[2rem] md:rounded-full p-1.5 transition-all duration-300 w-full md:w-auto",
            isExpanded
              ? "bg-[#f5f4f8] shadow-[0_8px_32px_rgba(15,14,23,0.10)] border border-transparent"
              : "bg-white shadow-[0_2px_8px_rgba(15,14,23,0.07)] border border-black/[0.07]",
          ].join(" ")}>
          <div
            onClick={() => setActiveTab("search")}
            className={[
              "relative flex flex-col justify-center rounded-full px-6 py-2.5 min-h-[60px] cursor-pointer transition-all duration-200",
              sticky ? "md:min-w-[130px]" : "md:min-w-[200px]",
              activeTab === "search"
                ? "bg-white shadow-[0_8px_32px_rgba(15,14,23,0.10)] scale-[1.02] z-10"
                : "hover:bg-[#eeecf5]",
            ].join(" ")}>
            <span className="text-[10px] font-bold tracking-[0.08em] uppercase text-[#0f0e17] mb-1 leading-none select-none">
              Search Business
            </span>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Name, service..."
                className="esw-placeholder flex-1 min-w-0 bg-transparent border-none outline-none ring-0 text-[13px] font-medium text-[#0f0e17] p-0 focus:ring-0 focus:outline-none"
              />
              <AnimatePresence>
                {inputValue && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setInputValue("");
                    }}
                    className="flex items-center justify-center w-5 h-5 shrink-0 rounded-full opacity-50 hover:opacity-100 hover:bg-black/10 transition-all border-none bg-transparent cursor-pointer">
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
            placeholder="Select location"
            onClear={() => setLocation("")}
            segW={segW}>
            <div className="p-2 py-3 w-full md:w-auto">
              {[
                { city: "sydney", country: "Australia", emoji: "🌉" },
                { city: "canberra", country: "Australia", emoji: "🏛️" },
              ].map(({ city, country, emoji }) => (
                <motion.div
                  key={city}
                  whileHover={{ x: 2 }}
                  className="group flex items-center gap-3.5 rounded-2xl px-3.5 py-3 cursor-pointer hover:bg-[#f5f4f8] transition-colors duration-150 min-w-full md:min-w-[280px]"
                  onClick={() => {
                    setLocation(city);
                    setActiveTab("cat");
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

          <Divider hide={activeTab === "cat" || activeTab === "where"} />

          <SegmentSection
            label="Category"
            isActive={activeTab === "cat"}
            onClick={() => setActiveTab(activeTab === "cat" ? null : "cat")}
            displayValue={activeCategory === "all" ? "" : activeCategory}
            placeholder="All Categories"
            onClear={() => setActiveCategory("all")}
            segW={segW}
            panelAlign="right">
            <div className="p-4 grid grid-cols-2 xs:grid-cols-3 gap-2 w-full md:w-[340px] max-h-[60vh] md:max-h-[400px] overflow-y-auto">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setActiveCategory(cat.value);
                      setActiveTab(null);
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border shrink-0 group ${
                      isActive
                        ? "bg-[#051e3a] border-[#051e3a] text-white shadow-lg"
                        : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50"
                    }`}>
                    <Icon
                      className={`h-5 w-5 mb-1.5 transition-colors ${isActive ? "text-white" : "text-slate-500 group-hover:text-[#6c47ff]"}`}
                    />
                    <span className="text-[10px] uppercase font-bold text-center leading-tight">
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </SegmentSection>

          <button
            onClick={handleSearch}
            className="flex mt-2 md:mt-0 md:ml-2 items-center rounded-full bg-[#051e3a] text-white shrink-0 min-h-[56px] md:min-h-[48px] justify-center overflow-hidden shadow-[0_4px_16px_rgba(5,30,58,0.35)] hover:bg-[#0b3463] transition-all cursor-pointer border-none w-full md:w-auto md:min-w-[48px]">
            <span className="flex items-center justify-center px-3.5">
              <Search size={18} strokeWidth={3} />
            </span>
            <span className="md:hidden font-bold text-[15px]">
              Search Businesses
            </span>
            <AnimatePresence>
              {isExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="hidden md:block pr-5 font-bold text-[13px] whitespace-nowrap overflow-hidden">
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

// --- REUSED HELPERS FROM YOUR REFERENCE ---

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

  const hasValue = !!displayValue;

  return (
    <div className="relative">
      <div
        onClick={handleClick}
        className={[
          "esw-seg relative flex flex-col justify-center max-sm:w-full rounded-full px-6 py-2.5 min-h-[60px] cursor-pointer select-none overflow-hidden transition-all duration-200",
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
            hasValue
              ? "text-[#0f0e17] font-medium"
              : "font-light italic text-[#9896aa]",
          ].join(" ")}
          style={!hasValue ? { fontFamily: "'Fraunces', serif" } : undefined}>
          {hasValue ? displayValue : placeholder}
        </span>
        {hasValue && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="esw-clear-show absolute top-1/2 -translate-y-1/2 right-2 flex items-center justify-center w-[18px] h-[18px] rounded-full opacity-0 hover:!opacity-100 hover:bg-black/10 transition-all z-20 border-none bg-transparent cursor-pointer">
            <X size={10} strokeWidth={3} />
          </button>
        )}
      </div>
      <AnimatePresence>
        {isActive && (
          <motion.div
            className={[
              "absolute top-[calc(100%+18px)] z-50 bg-white rounded-[2rem] overflow-hidden",
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
