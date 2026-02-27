"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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

const CATEGORIES = [
  { name: "All", icon: Store, value: "all" },
  { name: "Automotive", icon: Car, value: "Automotive" },
  { name: "Barber", icon: Scissors, value: "Barber" },
  { name: "Cafe", icon: Coffee, value: "Cafe" },
  { name: "Cleaning", icon: Eraser, value: "Cleaning" },
  { name: "Consultancy", icon: Briefcase, value: "Consultancy" },
  { name: "Driving School", icon: Car, value: "Driving School" },
  { name: "Electrician", icon: Zap, value: "Electrician" },
  { name: "Event Organizer", icon: Calendar, value: "Event Organizer" },
  { name: "Food Truck", icon: Truck, value: "Food Truck" },
  { name: "Grocery", icon: ShoppingBasket, value: "Grocery" },
  { name: "Painter", icon: Paintbrush, value: "Painter" },
  { name: "Photography", icon: Camera, value: "Photography" },
  { name: "Plumber", icon: Pipette, value: "Plumber" },
  { name: "Pujari", icon: Users, value: "Pujari" },
  { name: "Removalists", icon: Move, value: "Removalists" },
  { name: "Restaurant", icon: Utensils, value: "Restaurant" },
  { name: "Saloon & Makeup", icon: Sparkles, value: "Saloon and Makeup" },
  { name: "Shop", icon: ShoppingBag, value: "Shop" },
  { name: "Social Club", icon: Users, value: "Social Club" },
  { name: "Travel & Tours", icon: Plane, value: "Travel and Tours" },
  { name: "Others", icon: MoreHorizontal, value: "Others" },
];

export default function BusinessHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
        <input
          type="text"
          value={inputValue}
          onChange={handleSearchChange}
          placeholder="What are you looking for?"
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
        />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar scroll-smooth">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.value;

          return (
            <button
              key={cat.value}
              onClick={() => handleCategoryClick(cat.value)}
              className={`flex flex-col items-center justify-center min-w-[100px] p-3 rounded-2xl transition-all border shrink-0 ${
                isActive
                  ? "bg-red-600 border-red-600 text-white shadow-lg shadow-blue-200"
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
