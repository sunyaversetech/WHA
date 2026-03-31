"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Tag,
  ShoppingBag,
  Utensils,
  Coffee,
  Shirt,
  Globe,
} from "lucide-react";
import debounce from "lodash.debounce";

const CATEGORY_ICONS: Record<string, any> = {
  all: Globe,
  shopping: ShoppingBag,
  restaurant: Utensils,
  cafe: Coffee,
  fashion: Shirt,
  deal: Tag,
};

const BASE_CATEGORIES = [
  { name: "All", value: "all" },
  { name: "Groceries", value: "Groceries" },
  { name: "Shopping", value: "Shopping" },
  { name: "Restaurant", value: "Restaurant" },
  { name: "Fashion", value: "Fashion" },
  { name: "Events", value: "Events" },
];

export default function DealsHeader() {
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
      icon: CATEGORY_ICONS[cat.value.toLowerCase()] || Tag,
    }));
  }, []);

  return (
    <div className="w-full  px-4 py-2 md:px-6 md:py-4 rounded-xl md:rounded-2xl ">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 gap-2">
        <h1 className="text-lg md:text-xl font-bold text-slate-800">
          Select Category
        </h1>

        {/* <Tabs value={currentTab} onValueChange={handleTabChange}>
          <TabsList>
            <TabsTrigger value="list">List</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>
        </Tabs> */}
      </div>

      {/* Search */}
      <div className="flex flex-row gap-2 mb-3">
        {/* <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />

          <input
            type="text"
            value={inputValue}
            onChange={handleSearchChange}
            placeholder="Search Deals"
            className="w-full pl-10 pr-3 py-2 text-base border border-slate-200 rounded-full focus:outline-none"
          />
        </div> */}

        {/* <div className="flex-none">
          <div className="text-center px-3 py-2 text-sm md:text-base bg-primary border text-white rounded-full cursor-pointer transition hover:bg-white hover:text-primary">
            All Deals
          </div>
        </div> */}
      </div>

      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
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
              }`}>
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
