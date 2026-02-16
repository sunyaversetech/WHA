"use client";

import { useState, useMemo, useCallback } from "react";
import { getEvents } from "@/lib/data/events";
import EventCard from "@/components/cards/event-card";
import { Search, Calendar, Filter, X } from "lucide-react";
import CategoryTabs from "@/components/category-tabs";
import { useCityFilter } from "@/contexts/city-filter-context";
import { filterByCity } from "@/lib/utils/city-filter";

export default function EventsPageClient() {
  const { selectedCity } = useCityFilter();
  const allEvents = getEvents();
  const events = filterByCity(allEvents, selectedCity);
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");

  // mobile search
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  // Memoize featured events data to prevent recalculation
  const featuredEvents = useMemo(() => {
    const featuredEventIds = ["wha001", "4", "3"]; // Nawaj Sydney, Dashain, Teej
    return featuredEventIds
      .map((id) => events.find((event) => event.id === id))
      .filter(Boolean);
  }, [events]);

  // Memoize filtered events to prevent recalculation on every render
  const filteredEvents = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return events.filter((event) => {
      const categoryMatch =
        activeCategory === "all" || event.category === activeCategory;
      const searchMatch =
        searchTerm === "" ||
        event.title.toLowerCase().includes(searchLower) ||
        event.description.toLowerCase().includes(searchLower) ||
        event.venue.toLowerCase().includes(searchLower);

      return categoryMatch && searchMatch;
    });
  }, [events, activeCategory, searchTerm]);

  // Memoize banner data
  const bannerData = useMemo(
    () => ({
      images: featuredEvents.map((event) => event?.image || ""),
      eventIds: featuredEvents.map((event) => event?.id || ""),
      eventTitles: featuredEvents.map((event) => event?.title || ""),
      eventDescriptions: featuredEvents.map(
        (event) => event?.description || "",
      ),
    }),
    [featuredEvents],
  );

  // Remove the click outside functionality - filter should only close when button is clicked
  // This allows users to scroll through events while keeping filters visible

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

  const toggleFilters = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative">
      <div className="relative z-10">
        {/* Compact Mobile Header with Desktop Preservation */}
        <div className="container-modern py-3 md:py-4">
          {/* Header Container - More Compact on Mobile */}
          <div className="bg-white/80 border border-white/30 rounded-lg px-3 pb-2 pt-0 shadow md:rounded-xl md:p-6 md:shadow-lg">
            {/* Header Row - Simplified on Mobile */}
            <div className="flex items-center justify-between  md:justify-start md:gap-3 md:mb-2">
              {/* Title Group - More Compact */}
              <div className="flex items-center gap-2">
                <div>
                  <h1 className="text-sm font-bold text-secondary  md:text-lg lg:text-2xl">
                    Trending Events
                  </h1>
                  <p className="text-neutral text-xs hidden md:block">
                    Discover exciting events happening in your city
                  </p>
                </div>
              </div>

              {/* Mobile Filter Trigger - Only shows on mobile */}
              <div className="relative md:hidden">
                <button
                  className={`mobile-search-button p-1.5 rounded-lg transition-colors ${
                    mobileSearchOpen
                      ? "bg-white text-primary"
                      : "bg-neutral/50 hover:bg-neutral/100"
                  }`}
                  onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                  title={mobileSearchOpen ? "Close filters" : "Open filters"}>
                  <Filter
                    className={`h-5 w-5 transition-colors ${
                      mobileSearchOpen ? "text-primary" : "text-secondary"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Search and City Filter - Hidden by default on mobile, shown when activated */}
            <div
              className={` mobile-search-container flex-col gap-2 mb-2 transition-all duration-300 ease-in-out ${
                mobileSearchOpen
                  ? "flex opacity-100 max-h-96"
                  : "hidden opacity-0 max-h-0 md:flex md:opacity-100 md:max-h-none"
              } md:flex-row md:gap-4 md:mb-4`}>
              {/* Search Input */}
              <div className="relative w-full">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="h-4 w-4 text-neutral" />
                </div>
                <input
                  type="text"
                  placeholder="Search events..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-white/60 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors text-gray-700 placeholder-gray-400 md:pl-12 md:pr-10 md:py-3 md:text-base md:rounded-xl"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-neutral/200 transition-colors md:right-3"
                    aria-label="Clear search">
                    <X className="h-3 w-3 text-neutral hover:text-secondary md:h-4 md:w-4" />
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
              <div className="flex gap-1 min-w-max md:min-w-0 md:gap-2">
                <CategoryTabs
                  type="events"
                  onCategoryChange={handleCategoryChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className=" md:mt-4 bg-base rounded-t-3xl">
          <div className="container-modern py-4 md:pb-6">
            {/* Events Grid */}
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12 card-lg">
                <div className="p-8">
                  <Calendar className="h-16 w-16 text-neutral mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No events found
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Try adjusting your search or filters to find more events
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {filteredEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
