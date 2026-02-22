"use client";

import { useState, useMemo, useCallback } from "react";
import { getBusinesses } from "@/lib/data/businesses";
import BusinessCard from "@/components/cards/business-card";
import { Search, List, Map, Building, X, Filter } from "lucide-react";
import CategoryTabs from "@/components/category-tabs";
import { useCityFilter } from "@/contexts/city-filter-context";
import { filterByCity } from "@/lib/utils/city-filter";

import dynamic from "next/dynamic";

const BusinessMap = dynamic(() => import("@/components/business-map"), {
  ssr: false,
});

export default function BusinessesClientPage() {
  const { selectedCity } = useCityFilter();
  const allBusinesses = getBusinesses();
  const businesses = filterByCity(allBusinesses, selectedCity);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const featuredBusinesses = useMemo(() => {
    const featuredBusinessIds = ["lakeside-gurkhas", "wow-fresh", "united-pay"];
    return featuredBusinessIds
      .map((id) => businesses.find((business) => business.id === id))
      .filter(Boolean);
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();

    const categoryFiltered =
      activeCategory === "all"
        ? businesses
        : businesses.filter((business) => business.category === activeCategory);

    // Then filter by search term
    return categoryFiltered.filter((business) => {
      const searchMatch =
        searchTerm === "" ||
        business.name.toLowerCase().includes(searchLower) ||
        business.description.toLowerCase().includes(searchLower) ||
        business.location.toLowerCase().includes(searchLower);

      return searchMatch;
    });
  }, [businesses, activeCategory, searchTerm]);

  // Memoize event handlers to prevent unnecessary re-renders
  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setActiveCategory("all");
  }, []);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchTerm(e.target.value);
    },
    [],
  );

  const clearSearch = useCallback(() => {
    setSearchTerm("");
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === "list" ? "map" : "list"));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-modern relative">
      <div className="relative z-10">
        {/* Compact Mobile Header with Desktop Preservation */}
        <div className="container-modern py-3 md:py-6">
          {/* Header Container - More Compact on Mobile */}
          <div className="card-lg p-3 md:p-6">
            {/* Header Row - Simplified on Mobile */}
            <div className="flex flex-wrap items-center justify-between mb-2  md:gap-3 md:mb-4 gap-y-2">
              {/* Title Group - More Compact */}
              <div className="flex items-center gap-2">
                <div className="p-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg md:p-2 md:rounded-2xl">
                  <Building className="h-4 w-4 text-white md:h-6 md:w-6" />
                </div>
                <div>
                  <h1 className="text-sm font-bold gradient-text md:text-lg lg:text-2xl">
                    Local Businesses
                  </h1>
                  <p className="text-gray-600 text-xs hidden md:block">
                    Discover amazing Nepali businesses around you
                  </p>
                </div>
              </div>

              {/* Desktop View Mode Toggle */}
              {/* <div className="hidden md:flex items-center space-x-2">
                <button
                  onClick={toggleViewMode}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-white/60 border border-white/30 text-gray-700 hover:bg-white/80'
                  }`}
                >
                  {viewMode === 'list' ? (
                    <>
                      <List className="h-4 w-4" />
                      <span>List</span>
                    </>
                  ) : (
                    <>
                      <Map className="h-4 w-4" />
                      <span>Map</span>
                    </>
                  )}
                </button>
              </div> */}

              {/* side by side  */}
              <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                {/* List View Button */}
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center space-x-2 md:px-3 md:py-2  px-2 py-1 text-sm  md:text-base rounded-lg transition-all duration-200 ${
                    viewMode === "list"
                      ? "bg-purple-500 text-white shadow-md"
                      : "bg-white/60 border border-white/30 text-gray-700 hover:bg-white/80"
                  }`}>
                  <List className="h-4 w-4" />
                  <span>List</span>
                </button>

                {/* Map View Button */}
                <button
                  onClick={() => setViewMode("map")}
                  className={`flex items-center space-x-2   md:px-3 md:py-2 px-2 py-1 text-sm md:text-base rounded-lg transition-all duration-200 ${
                    viewMode === "map"
                      ? "bg-purple-500 text-white shadow-md"
                      : "bg-white/60 border border-white/30 text-gray-700 hover:bg-white/80"
                  }`}>
                  <Map className="h-4 w-4" />
                  <span>Map</span>
                </button>
              </div>

              <div className="relative md:hidden">
                <button
                  className={`mobile-search-button p-1.5 rounded-lg transition-colors ${
                    mobileSearchOpen
                      ? "bg-purple-500 hover:bg-purple-600 shadow-md"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                  title={mobileSearchOpen ? "Close filters" : "Open filters"}>
                  <Filter
                    className={`h-4 w-4 ${
                      mobileSearchOpen ? "text-white" : "text-gray-500"
                    }`}
                  />
                </button>
                {(searchTerm || selectedCity !== "all") && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </div>
            </div>

            <div
              className={`mobile-search-container flex-col gap-2 mb-2 transition-all duration-300 ease-in-out ${
                mobileSearchOpen
                  ? "flex opacity-100 max-h-96"
                  : "hidden opacity-0 max-h-0 md:flex md:opacity-100 md:max-h-none"
              } md:flex-row md:gap-4 md:mb-4`}>
              {/* Search Input */}
              <div className="relative w-full">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search businesses..."
                  className="input-modern pl-9 pr-8 py-2 text-xs md:pl-12 md:pr-10 md:py-3 md:text-base"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors md:right-3">
                    <X className="h-3 w-3 text-gray-400 hover:text-gray-600 md:h-4 md:w-4" />
                  </button>
                )}
              </div>

              {/* Clear All Filters Button - Only show on mobile when filters are active */}
              {searchTerm && (
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors font-medium md:hidden">
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Category Tabs - Ultra Compact on Mobile */}
            <div className="overflow-x-auto -mx-1 md:mx-0">
              <div className="flex gap-1 min-w-max md:min-w-0  md:gap-2">
                <CategoryTabs
                  type="businesses"
                  onCategoryChange={handleCategoryChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Businesses List/Map */}
        <div className="container-modern pb-8">
          {viewMode === "list" ? (
            filteredBusinesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {filteredBusinesses.map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 card-lg">
                <div className="p-8">
                  <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No businesses found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Try adjusting your search or filters
                  </p>
                  {/* <button className="btn-primary" onClick={clearFilters}>
                    Clear Filters
                  </button> */}
                </div>
              </div>
            )
          ) : (
            <div className="card-lg p-4 md:p-6">
              <BusinessMap businesses={filteredBusinesses} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
