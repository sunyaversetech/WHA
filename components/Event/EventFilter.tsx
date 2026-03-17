//

// new code

"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Globe,
  Music,
  BookOpen,
  Users,
  Tent,
  Utensils,
} from "lucide-react";
import debounce from "lodash.debounce";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";

const CATEGORY_ICONS: Record<string, any> = {
  all: Globe,
  community: Users,
  festival: Tent,
  "cultural event": Music,
  event: BookOpen,
  others: Utensils,
};

const BASE_CATEGORIES = [
  { name: "All", value: "all" },
  { name: "Community", value: "Community" },
  { name: "Festival", value: "Festival" },
  { name: "Cultural Event", value: "Cultural Event" },
  { name: "Event", value: "Event" },
  { name: "Others", value: "Others" },
];

export default function EventHeader() {
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

  const CATEGORIES = useMemo(() => {
    return BASE_CATEGORIES.map((cat) => ({
      ...cat,
      icon: CATEGORY_ICONS[cat.value.toLowerCase()] || Globe,
    }));
  }, []);

  const currentCity = searchParams.get("city");
  const currentCommunity = searchParams.get("community");

  return (
    <div className="w-full bg-white px-4  py-2 md:px-6 md:py-4 rounded-xl md:rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-2 gap-2">
        <h1 className="text-lg md:text-xl font-bold text-slate-800">
          Trending Events
        </h1>

        <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex flex-row gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
          <input
            type="text"
            value={inputValue}
            onChange={handleSearchChange}
            placeholder="Search Events"
            className="w-full pl-10 pr-3 py-2 text-base border border-slate-200 rounded-full focus:outline-none"
          />
        </div>

        <div className="flex-none">
          <Select
            onValueChange={(val) => {
              updateQuery({ community: val === "All" ? null : val });
            }}
          >
            <SelectTrigger className="flex items-center gap-2 border border-blue-950 rounded-full text-blue-950 font-bold capitalize">
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

              {/* <SelectItem value="Indian">
                <span className="flex items-center gap-2">Indian</span>
              </SelectItem>

              <SelectItem value="Bhutanese">
                <span className="flex items-center gap-2">Bhutanese</span>
              </SelectItem>

              <SelectItem value="European">
                <span className="flex items-center gap-2">European</span>
              </SelectItem>

              <SelectItem value="Others">
                <span className="flex items-center gap-2">Others</span>
              </SelectItem> */}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.value;

          return (
            <button
              key={cat.value}
              onClick={() => handleCategoryClick(cat.value)}
              className={`flex flex-col items-center justify-center md:min-w-[80px] py-2 px-3 rounded-md md:rounded-xl transition-all border shrink-0 ${
                isActive
                  ? "bg-primary border-primary text-white"
                  : "bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <Icon
                className={`h-4 w-4 sm:h-5 sm:w-5 mb-1 ${
                  isActive ? "text-white" : "text-slate-500"
                }`}
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
