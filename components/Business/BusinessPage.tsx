"use client";

import BusinessCard from "@/components/cards/business-card";
import { Calendar, Filter, Globe, Map, MapPin } from "lucide-react";

import dynamic from "next/dynamic";
import BusinessHeader from "./BusinessFilter";
import { useGetBusiness } from "@/services/business.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import BusinessSearchWithDates from "../ResuableComponents/SearchSectionforBusiness";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useCallback, useEffect, useState } from "react";
import { Separator } from "../ui/separator";

const BusinessMap = dynamic(() => import("./business-map"), {
  ssr: false,
});

const COMMUNITIES = [
  { name: "All Community", value: "All", icon: Globe },
  { name: "Australian", value: "Australian", icon: MapPin },
  { name: "Nepali", value: "Nepali", icon: MapPin },
];

export default function BusinessesClientPage() {
  const { data, isLoading } = useGetBusiness();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "list";
  const [currentCommunity, setCurrentCommunity] = useState("All");
  const router = useRouter();
  const [isSticky, setIsSticky] = useState(false);
  const [scroll, setIsScroll] = useState(window.scrollY);

  const handleTabChange = (value: string) => {
    updateQuery({ view: value });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsSticky(true);
      } else {
        setIsSticky(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
  return (
    // <div className="min-h-screen bg-gradient-modern relative">
    //   <div className="relative z-10">
    //     {/* Compact Mobile Header with Desktop Preservation */}
    //     <div className="container-modern py-3 md:py-6">
    //       {/* Header Container - More Compact on Mobile */}
    //       <div className="card-lg p-3 md:p-6">
    //         {/* Header Row - Simplified on Mobile */}
    //         <div className="flex flex-wrap items-center justify-between mb-2  md:gap-3 md:mb-4 gap-y-2">
    //           {/* Title Group - More Compact */}
    //           <div className="flex items-center gap-2">
    //             <div className="p-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg md:p-2 md:rounded-2xl">
    //               <Building className="h-4 w-4 text-white md:h-6 md:w-6" />
    //             </div>
    //             <div>
    //               <h1 className="text-sm font-bold gradient-text md:text-lg lg:text-2xl">
    //                 Local Businesses
    //               </h1>
    //               <p className="text-gray-600 text-xs hidden md:block">
    //                 Discover amazing Nepali businesses around you
    //               </p>
    //             </div>
    //           </div>

    //           {/* Desktop View Mode Toggle */}
    //           {/* <div className="hidden md:flex items-center space-x-2">
    //             <button
    //               onClick={toggleViewMode}
    //               className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 ${
    //                 viewMode === 'list'
    //                   ? 'bg-purple-500 text-white shadow-md'
    //                   : 'bg-white/60 border border-white/30 text-gray-700 hover:bg-white/80'
    //               }`}
    //             >
    //               {viewMode === 'list' ? (
    //                 <>
    //                   <List className="h-4 w-4" />
    //                   <span>List</span>
    //                 </>
    //               ) : (
    //                 <>
    //                   <Map className="h-4 w-4" />
    //                   <span>Map</span>
    //                 </>
    //               )}
    //             </button>
    //           </div> */}

    //           {/* side by side  */}
    //           <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
    //             {/* List View Button */}
    //             <button
    //               onClick={() => setViewMode("list")}
    //               className={`flex items-center space-x-2 md:px-3 md:py-2  px-2 py-1 text-sm  md:text-base rounded-lg transition-all duration-200 ${
    //                 viewMode === "list"
    //                   ? "bg-purple-500 text-white shadow-md"
    //                   : "bg-white/60 border border-white/30 text-gray-700 hover:bg-white/80"
    //               }`}>
    //               <List className="h-4 w-4" />
    //               <span>List</span>
    //             </button>

    //             {/* Map View Button */}
    //             <button
    //               onClick={() => setViewMode("map")}
    //               className={`flex items-center space-x-2   md:px-3 md:py-2 px-2 py-1 text-sm md:text-base rounded-lg transition-all duration-200 ${
    //                 viewMode === "map"
    //                   ? "bg-purple-500 text-white shadow-md"
    //                   : "bg-white/60 border border-white/30 text-gray-700 hover:bg-white/80"
    //               }`}>
    //               <Map className="h-4 w-4" />
    //               <span>Map</span>
    //             </button>
    //           </div>

    //           <div className="relative md:hidden">
    //             <button
    //               className={`mobile-search-button p-1.5 rounded-lg transition-colors ${
    //                 mobileSearchOpen
    //                   ? "bg-purple-500 hover:bg-purple-600 shadow-md"
    //                   : "bg-gray-100 hover:bg-gray-200"
    //               }`}
    //               onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
    //               title={mobileSearchOpen ? "Close filters" : "Open filters"}>
    //               <Filter
    //                 className={`h-4 w-4 ${
    //                   mobileSearchOpen ? "text-white" : "text-gray-500"
    //                 }`}
    //               />
    //             </button>
    //             {(searchTerm || selectedCity !== "all") && (
    //               <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
    //             )}
    //           </div>
    //         </div>

    //         <div
    //           className={`mobile-search-container flex-col gap-2 mb-2 transition-all duration-300 ease-in-out ${
    //             mobileSearchOpen
    //               ? "flex opacity-100 max-h-96"
    //               : "hidden opacity-0 max-h-0 md:flex md:opacity-100 md:max-h-none"
    //           } md:flex-row md:gap-4 md:mb-4`}>
    //           {/* Search Input */}
    //           <div className="relative w-full">
    //             <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
    //               <Search className="h-4 w-4 text-gray-400" />
    //             </div>
    //             <input
    //               type="text"
    //               placeholder="Search businesses..."
    //               className="input-modern pl-9 pr-8 py-2 text-xs md:pl-12 md:pr-10 md:py-3 md:text-base"
    //               value={searchTerm}
    //               onChange={handleSearchChange}
    //             />
    //             {searchTerm && (
    //               <button
    //                 onClick={clearSearch}
    //                 className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 transition-colors md:right-3">
    //                 <X className="h-3 w-3 text-gray-400 hover:text-gray-600 md:h-4 md:w-4" />
    //               </button>
    //             )}
    //           </div>

    //           {/* Clear All Filters Button - Only show on mobile when filters are active */}
    //           {searchTerm && (
    //             <button
    //               onClick={clearFilters}
    //               className="w-full px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors font-medium md:hidden">
    //               Clear All Filters
    //             </button>
    //           )}
    //         </div>

    //         <div className="overflow-x-auto -mx-1 md:mx-0">
    //           <div className="flex gap-1 min-w-max md:min-w-0  md:gap-2">
    //             <CategoryTabs
    //               type="businesses"
    //               onCategoryChange={handleCategoryChange}
    //             />
    //           </div>
    //         </div>
    //       </div>
    //     </div>

    //     <div className="container-modern pb-8">
    //       {viewMode === "list" ? (
    //         filteredBusinesses.length > 0 ? (
    //           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
    //             {filteredBusinesses.map((business) => (
    //               <BusinessCard key={business.id} business={business} />
    //             ))}
    //           </div>
    //         ) : (
    //           <div className="text-center py-12 card-lg">
    //             <div className="p-8">
    //               <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
    //               <h3 className="text-xl font-semibold text-gray-700 mb-2">
    //                 No businesses found
    //               </h3>
    //               <p className="text-gray-500 mb-6">
    //                 Try adjusting your search or filters
    //               </p>
    //               {/* <button className="btn-primary" onClick={clearFilters}>
    //                 Clear Filters
    //               </button> */}
    //             </div>
    //           </div>
    //         )
    //       ) : (
    //         <div className="card-lg p-4 md:p-6">
    //           <BusinessMap businesses={filteredBusinesses} />
    //         </div>
    //       )}
    //     </div>
    //   </div>
    // </div>

    <div className="min-h-screen bg-neutral-50 pb-20 mx-4 md:mx-6">
      <BusinessSearchWithDates />
      <Separator />
      <div className="container-modern py-4 md:py-8  w-auto">
        {/* <BusinessHeader /> */}

        <div className="flex items-end justify-end ">
          <Dialog>
            {view === "list" && (
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className={`flex items-center gap-2 rounded-md btn-wha-outline 
                    ${
                      currentCommunity !== "All" || searchParams.get("category")
                        ? "btn-wha-outline text-white"
                        : "border border-gray-300! text-gray-700 hover:bg-gray-100"
                    }  
                   h-12 mr-2`}>
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </DialogTrigger>
            )}
            <DialogContent className="max-w-4xl w-full">
              <DialogTitle className="text-lg font-bold mb-4">
                Filter Events
              </DialogTitle>
              <Tabs
                defaultValue="categories"
                className="w-full overflow-scroll no-scrollbar rounded-lg border bg-white ">
                <TabsList className="w-full border-none ">
                  <TabsTrigger
                    value="categories"
                    className="data-[state=active]:bg-white data-[state=active]:underline text-wha-p 
                    data-[state=active]:text-wha-primary data-[state=active]:underline-offset-8 data-[state=active]:decoration-2 data-[state=active]:shadow-none!">
                    Categories
                  </TabsTrigger>
                  <TabsTrigger
                    className="data-[state=active]:bg-white data-[state=active]:underline text-wha-p 
                    data-[state=active]:text-wha-primary data-[state=active]:underline-offset-8 data-[state=active]:decoration-2 data-[state=active]:shadow-none!"
                    value="communities">
                    Communities
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="categories">
                  <BusinessHeader />
                </TabsContent>
                <TabsContent
                  value="communities"
                  className="flex flex-wrap gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                  {/* <EventMap events={events} /> */}
                  <div className="flex gap-2 justify-center items-center m-auto">
                    {COMMUNITIES.map((com) => {
                      const Icon = com.icon;
                      const isActive =
                        (currentCommunity ?? "All") === com.value;

                      return (
                        <Button
                          key={com.value}
                          onClick={() => {
                            updateQuery({
                              community: com.value === "All" ? null : com.value,
                            });
                            setCurrentCommunity(com.value);
                          }}
                          className={`flex flex-col items-center justify-center h-15 md:min-w-[80px] py-5 px-3 rounded-md md:rounded-xl transition-all border shrink-0 ${
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
                            {com.name}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
              {/* <EventMap events={events} /> */}
            </DialogContent>
          </Dialog>
          <Tabs onValueChange={handleTabChange} value={view}>
            <TabsList className="border-none">
              <TabsTrigger
                value={`${view === "list" ? "map" : "list"}`}
                className=" -mt-5">
                {view === "list" ? (
                  <span className="btn-wha-primary flex items-center gap-1 text-sm mt-2 cursor-pointer transition-wha-slow">
                    <Map className=" flex justify-end  h-5 w-5 text-wha-light" />
                    Show Map
                  </span>
                ) : (
                  <span className="btn-wha-primary flex items-center gap-1 text-sm mt-2 cursor-pointer transition-wha-slow">
                    <Calendar className=" flex justify-end  h-5 w-5 text-wha-light" />
                    Show List
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <Tabs value={view}>
          <TabsContent value="list">
            {isLoading ? (
              <div className="flex  items-center gap-2   mt-5">
                <Skeleton className="h-72 w-96 mb-4 animate-pulse rounded-xl" />
                <Skeleton className="h-72 w-96 mb-4 animate-pulse" />
                <Skeleton className="h-72 w-96 mb-4 animate-pulse" />
              </div>
            ) : data?.data.length === 0 ? (
              <div className=" mt-8 p-20 text-center bg-white rounded-3xl border-2 border-dashed border-neutral-200">
                <Calendar className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                <h3 className="text-lg font-semibold text-secondary">
                  No Business to show in this City or category
                </h3>
                <p className="text-sm text-neutral-500 mt-1 capitalize">
                  Try selecting `Australia` in the Navigation bar and All in
                  Filter above.
                </p>
              </div>
            ) : (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {data?.data.map((business: any) => (
                  <BusinessCard key={business._id} business={business} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="map">
            <div className="card-lg mt-8">
              <BusinessMap businesses={data?.data} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
