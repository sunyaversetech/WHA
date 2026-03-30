"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Store,
  Car,
  Scissors,
  Coffee,
  Eraser,
  Briefcase,
  Zap,
  Calendar,
  Truck,
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
import debounce from "lodash.debounce";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useGetALLBusiness } from "@/services/business.service";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";

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

export default function BusinessHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data } = useGetALLBusiness();
  const discoveredCategories = useRef<Set<string>>(new Set());
  const [categories, setCategories] = useState<string[]>([]);

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

  // { name: "All", icon: Store, value: "all" },
  // { name: "Automotive", icon: Car, value: "automotive" },
  // { name: "Barber", icon: Scissors, value: "narber" },
  // { name: "Cafe", icon: Coffee, value: "cafe" },
  // { name: "Cleaning", icon: Eraser, value: "cleaning" },
  // { name: "Consultancy", icon: Briefcase, value: "consultancy" },
  // { name: "Driving School", icon: Car, value: "driving School" },
  // { name: "Electrician", icon: Zap, value: "electrician" },
  // { name: "Event Organizer", icon: Calendar, value: "event Organizer" },
  // { name: "Food Truck", icon: Truck, value: "food Truck" },
  // { name: "Grocery", icon: ShoppingBasket, value: "grocery" },
  // { name: "Painter", icon: Paintbrush, value: "painter" },
  // { name: "Photography", icon: Camera, value: "photography" },
  // { name: "Plumber", icon: Pipette, value: "plumber" },
  // { name: "Pujari", icon: Users, value: "pujari" },
  // { name: "Removalists", icon: Move, value: "removalists" },
  // { name: "Restaurant", icon: Utensils, value: "restaurant" },
  // { name: "Saloon & Makeup", icon: Sparkles, value: "saloon and Makeup" },
  // { name: "Shop", icon: ShoppingBag, value: "shop" },
  // { name: "Social Club", icon: Users, value: "social Club" },
  // { name: "Travel & Tours", icon: Plane, value: "travel and Tours" },
  // { name: "Others", icon: MoreHorizontal, value: "others" },

  const activeCategory = searchParams.get("category") || "all";
  const currentTab = searchParams.get("view") || "list";

  const [inputValue, setInputValue] = useState(
    searchParams.get("search") || "",
  );

  useEffect(() => {
    setTimeout(() => {
      setInputValue(searchParams.get("search") || "");
    }, 0);
  }, [searchParams]);

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        updateQuery({ search: term });
      }, 500),
    [updateQuery],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);
  };

  const handleCategoryClick = (category: string) => {
    updateQuery({ category });
  };

  const handleTabChange = (value: string) => {
    updateQuery({ view: value });
  };
  const currentCity = searchParams.get("city");
  const currentCommunity = searchParams.get("community");

  return (
    <div className="w-full bg-white px-4 py-2 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
      {/* Header + Tabs */}
      {/* <div className="flex items-center justify-between mb-2  gap-2">
        <h1 className="text-lg md:text-xl font-bold text-slate-800">
          Local Businesses
        </h1>
        <Tabs
          value={currentTab}
          onValueChange={handleTabChange}
          className="w-auto">
          <TabsList className="w-auto">
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>
        </Tabs>
      </div> */}

      {/* Search + All Community */}
      {/* <div className="flex flex-col md:flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />

          <input
            type="text"
            value={inputValue}
            onChange={handleSearchChange}
            placeholder="Search Local Businesses"
            className="w-full pl-10 pr-3 py-2 text-base border border-slate-200 rounded-full focus:outline-none "
          />
        </div>
        <div className="flex-none w-full md:w-auto">
          <Select
            onValueChange={(val) => {
              updateQuery({ community: val === "All" ? null : val });
            }}>
            <SelectTrigger className="flex items-center w-full gap-2 border border-primary rounded-full text-primary font-bold capitalize">
              {currentCommunity ?? "All Community"}
            </SelectTrigger>
            <SelectContent popover="auto" position="popper">
              <SelectItem value="All">
                <span className="flex items-center gap-2 ">All Community</span>
              </SelectItem>

              <SelectItem value="Australian">
                <span className="flex items-center gap-2">Australian</span>
              </SelectItem>

              <SelectItem value="Nepali">
                <span className="flex items-center gap-2">Nepali</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div> */}

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat?.value;

          return (
            <button
              key={cat.value}
              onClick={() => handleCategoryClick(cat?.value ?? "all")}
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
    </div>
  );
}
