"use client";

import DealCard from "@/components/cards/deal-card";
import { Search, Tag } from "lucide-react";
import { useGetAllDeals } from "@/services/deal.service";

export default function DealsPageClient() {
  const { data } = useGetAllDeals();

  return (
    <div className="min-h-screen bg-gradient-modern relative">
      <div className="relative z-10">
        <div className="container-modern py-3 md:py-6">
          <div className="card-lg p-3 md:p-6">
            <div className="flex items-center justify-between mb-2 md:justify-start md:gap-3 md:mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-green-500 rounded-sm md:p-2 md:rounded-lg">
                  <Tag className="h-4 w-4 text-white md:h-6 md:w-6" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-secondary md:text-lg lg:text-2xl">
                    Exclusive Deals
                  </h1>
                  <p className="text-gray-600 text-xs hidden md:block">
                    Discover amazing offers from local businesses
                  </p>
                </div>
              </div>

              {/* <div className="relative md:hidden">
                <button
                  className={`mobile-search-button p-1.5 rounded-lg transition-colors ${
                    mobileSearchOpen
                      ? "bg-green-500 hover:bg-green-600 shadow-md"
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
              </div> */}
            </div>

            <div
              className={`mobile-search-container flex-col gap-2 mb-2 transition-all duration-300 ease-in-out hidden opacity-0 max-h-0 md:flex md:opacity-100 md:max-h-none  md:flex-row md:gap-4 md:mb-4`}>
              <div className="relative w-full">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                {/* <input
                  type="text"
                  placeholder="Search deals..."
                  className="input-modern pl-9 pr-8 py-2 text-xs md:pl-12 md:pr-10 md:py-3 md:text-base"
                  value={searchTerm}
                  onChange={handleSearchChange}
                /> */}
                {/* {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors md:right-3">
                    <X className="h-3 w-3 text-gray-400 hover:text-gray-600 md:h-4 md:w-4" />
                  </button>
                )} */}
              </div>

              {/* Clear All Filters Button - Only show on mobile when filters are active */}
              {/* {searchTerm && (
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors font-medium md:hidden">
                  Clear All Filters
                </button>
              )} */}
            </div>

            {/* Category Tabs - Ultra Compact on Mobile */}
            {/* <div className="overflow-x-auto -mx-1 md:mx-0">
              <div className="flex gap-1  min-w-max md:min-w-0  md:gap-2">
                <CategoryTabs
                  type="deals"
                  onCategoryChange={handleCategoryChange}
                />
              </div>
            </div> */}
          </div>
        </div>

        {/* Deals List */}
        <div className="container-modern pb-8">
          {data?.data && data?.data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
              {data?.data.map((deal) => (
                <DealCard key={deal._id} deal={deal} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 card-lg">
              <div className="p-8">
                <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No deals found
                </h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search or filters
                </p>
                {/* <button className="btn-primary" onClick={clearFilters}>
                  Clear Filters
                </button> */}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
