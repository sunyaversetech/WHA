"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

let debouncedSearchFn: ReturnType<typeof debounce> | null = null;

const CATEGORIES = [
  { name: "All", icon: Globe, value: "all" },
  { name: "Community", icon: Users, value: "Community" },
  { name: "Festival", icon: Tent, value: "Festival" },
  { name: "Cultural Event", icon: Music, value: "Cultural Event" }, // Switched icon to Music for flair
  { name: "Event", icon: BookOpen, value: "Event" },
  { name: "Others", icon: Utensils, value: "Others" },
];

export default function EventHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [inputValue, setInputValue] = useState(
    searchParams.get("search") || "",
  );

  const updateQuery = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`?${params.toString()}`);
    },
    [router, searchParams],
  );

  const debouncedSearch = useCallback(
    (term: string) => {
      if (!debouncedSearchFn) {
        debouncedSearchFn = debounce((searchTerm: string) => {
          updateQuery("search", searchTerm);
        }, 500);
      }
      debouncedSearchFn(term);
    },
    [updateQuery],
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    debouncedSearch(value);
  };

  const handleCategoryClick = (category: string) => {
    updateQuery("category", category);
  };

  const activeCategory = searchParams.get("category") || "all";

  return (
    <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-800">Trending Events</h1>
        <p className="text-sm text-slate-400">
          Discover exciting events happening in your city
        </p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
        <input
          type="text"
          value={inputValue}
          onChange={handleSearchChange}
          placeholder="Search events..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
        />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.value;

          return (
            <button
              key={cat.value}
              onClick={() => handleCategoryClick(cat.value)}
              className={`flex flex-col items-center justify-center min-w-[80px] p-3 rounded-2xl transition-all border ${
                isActive
                  ? "bg-red-500 border-red-500 text-white shadow-lg shadow-red-200"
                  : "bg-white border-slate-100 text-slate-600 hover:border-slate-300"
              }`}>
              <Icon
                className={`h-5 w-5 mb-1 ${isActive ? "text-white" : "text-slate-500"}`}
              />
              <span className="text-[11px] font-semibold">{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
