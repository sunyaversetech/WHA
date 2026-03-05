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
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { useGetALLBusiness } from "@/services/business.service";

const CATEGORY_ICONS: Record<string, any> = {
  all: Store,
  automotive: Car,
  barber: Scissors,
  cafe: Coffee,
  cleaning: Eraser,
  consultancy: Briefcase,
  "driving school": Car,
  electrician: Zap,
  "event organizer": Calendar,
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

  console.log("Business Data", data);
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

  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-4">
        <h1 className="flex w-full justify-between text-xl font-bold text-slate-800">
          Find Local Businesses
          <Tabs value={currentTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
            </TabsList>
          </Tabs>
        </h1>
        <p className="text-sm text-slate-400">
          Search for top-rated services and shops in your area
        </p>
      </div>

      <div className="relative mb-6 flex gap-2">
        <div className="relative flex-[2]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 " />
          <input
            type="text"
            value={inputValue}
            onChange={handleSearchChange}
            placeholder="Search Local Businesses"
            className="w-full pl-12 pr-4 py-2 bg-white border border-slate-200 rounded-full focus:outline-none  transition-all"
          />
        </div>
        <div className="flex-[1]">
          <div className="p-2 text-center text-white border border-slate-200 rounded-full bg-primary transition-all hover:bg-white hover:text-primary">
            All Community
          </div>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat?.value;

          return (
            <button
              key={cat.value}
              onClick={() => handleCategoryClick(cat?.value ?? "all")}
              className={`flex flex-col items-center justify-center min-w-[100px] p-3 rounded-2xl transition-all border shrink-0 ${
                isActive
                  ? "bg-primary border-primary text-white"
                  : "bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}>
              <Icon
                className={`h-5 w-5 mb-2 ${isActive ? "text-white" : "text-slate-500"}`}
              />
              <span className="text-[10px] uppercase tracking-wider font-bold whitespace-nowrap">
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
