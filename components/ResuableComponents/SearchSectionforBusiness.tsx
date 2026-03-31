"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  X,
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

export default function BusinessSearchWithDates() {
  const [activeTab, setActiveTab] = useState<SearchState>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [location, setLocation] = useState("");
  const { data } = useGetALLBusiness();
  const [categories, setCategories] = useState<string[]>([]);
  const [isactiveCategory, setActiveCategory] = useState(
    searchParams.get("category") || "all",
  );
  const discoveredCategories = useRef<Set<string>>(new Set());
  const [inputValue, setInputValue] = useState(
    searchParams.get("search") || "",
  );

  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data?.data) {
      data.data.forEach((item: any) => {
        if (item.business_category) {
          discoveredCategories.current.add(item.business_category);
        }
      });
      setCategories(Array.from(discoveredCategories.current));
    }
  }, [data?.data]);

  const CATEGORIES = useMemo(() => {
    const base = [{ name: "All", value: "all", icon: Store }];

    const dynamic = categories.map((cat) => ({
      name: cat,
      value: cat,
      icon: CATEGORY_ICONS[cat.toLowerCase()] || Store,
    }));

    return [...base, ...dynamic];
  }, [categories]);
  const activeCategory = searchParams.get("category") || "all";

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
      `/businesses?search=${inputValue}${isactiveCategory !== "all" ? `&category=${isactiveCategory}` : ""}${location ? `&city=${location}` : ""}`,
    );
  };

  return (
    <div className="flex w-fit m-auto justify-center py-6" ref={containerRef}>
      <div
        className={`relative  flex items-center rounded-full border border-gray-200 transition-all duration-300 ${
          activeTab
            ? "bg-[#ebebeb] shadow-md"
            : "bg-white shadow-sm hover:shadow-md"
        }`}>
        <div className="w-52 flex flex-col rounded-full py-3 px-8 cursor-pointer transition-all duration-200">
          <p className="tracking-wider text-[12px] mt-2 ">Search Business</p>
          <div className="flex w-full justify-between">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search Business"
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

        <Divider hide={activeTab === "where" || activeTab === "cat"} />

        <SearchSection
          label="Where"
          value={location || "Select destinations"}
          isActive={activeTab === "where"}
          onClick={() => setActiveTab("where")}
          location={location}
          date={date}
          setLocation={setLocation}
          setInputValue={setInputValue}
          setDate={setDate}
          isActiveCategory={isactiveCategory}>
          <div className="w-[400px] p-8">
            {["sydney", "canberra"].map((city) => (
              <div
                key={city}
                onClick={() => {
                  setLocation(city);
                  setActiveTab("cat");
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

        <Divider hide={activeTab === "cat" || activeTab === "search"} />

        <SearchSection
          label="Category"
          value={activeCategory === "all" ? "All Categories" : activeCategory}
          isActive={activeTab === "cat"}
          onClick={() => setActiveTab("cat")}
          isActiveCategory={isactiveCategory}>
          <div className="p-4 flex flex-wrap gap-2 bg-white rounded-3xl">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = isactiveCategory === cat?.value;

              return (
                <button
                  onClick={() => setActiveCategory(cat.value)}
                  key={cat.value}
                  className={`flex flex-col items-center justify-center  md:min-w-[80px] py-2 px-3 rounded-md md:rounded-xl transition-all border shrink-0 ${
                    isActive
                      ? "bg-primary border-primary text-white"
                      : "bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}>
                  <Icon
                    className={`h-4 w-4 sm:h-5 sm:w-5 mb-1 ${isActive ? "text-white" : "text-slate-500"}`}
                  />
                  <span className="text-[9px] sm:text-[10px] uppercase font-bold whitespace-nowrap text-center">
                    {cat.name}
                  </span>
                </button>
              );
            })}
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
  children,
  isLast,
  location,
  setLocation,
  setActiveCategory,
  isActiveCategory,
}: any) {
  console.log("isActiveCategory", isActiveCategory);
  return (
    <div className="relative">
      <div
        onClick={onClick}
        className={`flex flex-col rounded-full py-3 w-52 px-8 cursor-pointer transition-all duration-200 ${
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

      {label === "Where" && location && (
        <X
          className="absolute z-50 top-1/2 -translate-y-1/2 right-2 h-4 w-4 text-black 
               cursor-pointer hover:bg-black/10 backdrop-blur-md p-0.5 
               hover:shadow-lg rounded-full transition-all duration-200"
          onClick={() => {
            setLocation("");
          }}
        />
      )}
      {label === "Category" && isActiveCategory !== "all" && (
        <X
          className="absolute top-5.5 right-0 h-4 w-4 text-black 
        cursor-pointer mr-2 hover:bg-black/10 backdrop-blur-md p-0.5 
        hover:shadow-lg   rounded-full  transition-all duration-200"
          onClick={() => {
            if (label === "cat") {
              setActiveCategory("");
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
