"use client";

import { useCallback, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Globe, MapIcon, MapPin, SlidersVertical } from "lucide-react";

import BusinessCard from "@/components/cards/business-card";
import BusinessHeader from "./BusinessFilter";
import { useGetBusiness } from "@/services/business.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "../ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "../ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";

const BusinessMap = dynamic(() => import("./business-map"), { ssr: false });

const COMMUNITIES = [
  { name: "All Community", value: "All", icon: Globe },
  { name: "Australian", value: "Australian", icon: MapPin },
  { name: "Nepali", value: "Nepali", icon: MapPin },
];

export default function BusinessesClientPage() {
  const { data: apiResponse, isLoading } = useGetBusiness();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showMap, setShowMap] = useState(true);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [currentCommunity, setCurrentCommunity] = useState("All");

  const data = apiResponse?.data || [];
  const toggleExpand = () => setIsMapExpanded(!isMapExpanded);

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      router.push(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return (
    <div className="flex flex-col min-h-screen pt-20 md:pt-40">
      {/* Sticky Header */}
      <div className="sticky top-19 md:top-39 z-40 bg-white px-6 py-4 flex justify-between items-center">
        <div className="text-sm font-medium text-slate-500">
          {data.length} businesses in {searchParams.get("city") ?? "Australia"}
        </div>

        <div className="flex gap-2">
          <Drawer>
            <DrawerTrigger asChild className="flex md:hidden">
              <Button variant="outline" size="sm">
                <SlidersVertical className="h-4 w-4" />
                Filters
              </Button>
            </DrawerTrigger>

            <DrawerContent className="max-w-4xl w-full min-h-[40vh] p-4">
              <DrawerTitle className="text-lg font-bold mb-4">
                Filter Businesses
              </DrawerTitle>

              <Tabs defaultValue="categories" className="w-full ">
                <TabsList className="w-full border-none bg-gray-100/10!">
                  <TabsTrigger
                    value="categories"
                    className="data-[state=active]:bg-gray-100/10! rounded-none data-[state=active]:text-black py-4 data-[state=active]:shadow-none! 
                    data-[state=active]:border-b-blue-950 border-2">
                    Categories
                  </TabsTrigger>
                  <TabsTrigger
                    value="communities"
                    className="data-[state=active]:bg-gray-100/10! rounded-none data-[state=active]:text-black py-4 data-[state=active]:shadow-none! 
                    data-[state=active]:border-b-blue-950 border-2">
                    Communities
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="categories">
                  <BusinessHeader />
                </TabsContent>

                <TabsContent value="communities">
                  <div className="flex flex-wrap gap-2 p-4 bg-white rounded-xl h-40 shadow-sm">
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
                          className={`flex flex-col items-center justify-center h-14 px-3 rounded-md border ${
                            isActive
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-slate-600"
                          }`}>
                          <Icon className="h-4 w-4 mb-1" />
                          <span className="text-[10px] uppercase">
                            {com.name}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </DrawerContent>
          </Drawer>

          <Dialog>
            <DialogTrigger asChild className="hidden md:flex">
              <Button variant="outline" size="sm">
                <SlidersVertical className="h-4 w-4" />
                Filters
              </Button>
            </DialogTrigger>

            <DialogContent className=" max-w-4xl w-full min-h-[40vh] p-4">
              <DialogTitle className="text-lg font-bold mb-4">
                Filter Businesses
              </DialogTitle>

              <Tabs defaultValue="categories" className="w-full">
                <TabsList className="w-full border-none bg-gray-100/10!">
                  <TabsTrigger
                    value="categories"
                    className="data-[state=active]:bg-gray-100/10! rounded-none data-[state=active]:text-black py-4 data-[state=active]:shadow-none! 
                    data-[state=active]:border-b-blue-950 border-2">
                    Categories
                  </TabsTrigger>
                  <TabsTrigger
                    value="communities"
                    className="data-[state=active]:bg-gray-100/10! rounded-none data-[state=active]:text-black py-4 data-[state=active]:shadow-none! 
                    data-[state=active]:border-b-blue-950 border-2">
                    Communities
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="categories">
                  <BusinessHeader />
                </TabsContent>

                <TabsContent value="communities">
                  <div className="flex flex-wrap gap-2 p-4 bg-white rounded-xl h-40 shadow-sm">
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
                          className={`flex flex-col items-center justify-center h-14 px-3 rounded-md border ${
                            isActive
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-slate-600"
                          }`}>
                          <Icon className="h-4 w-4 mb-1" />
                          <span className="text-[10px] uppercase">
                            {com.name}
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMap((prev) => !prev)}
            className="hidden md:flex">
            <MapIcon className="h-4 w-4" />
            {showMap ? "Hide map" : "Show map"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMapExpanded((prev) => !prev)}
            className="flex md:hidden">
            <MapIcon className="h-4 w-4" />
            {isMapExpanded ? "Hide map" : "Show map"}
          </Button>
        </div>
      </div>

      <div className={`flex ${isMapExpanded ? "" : "flex-1"} px-5 gap-6`}>
        <div
          className={`transition-all w-full ${
            isMapExpanded ? "hidden" : showMap ? "lg:w-[55%]" : "w-full"
          }`}>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-xl" />
              ))}
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-lg font-semibold">No businesses found</h3>
            </div>
          ) : (
            <div
              className={`grid gap-6 ${
                showMap
                  ? "grid-cols-1 xl:grid-cols-2"
                  : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
              }`}>
              {data.map((business: any) => (
                <BusinessCard key={business._id} business={business} />
              ))}
            </div>
          )}
        </div>

        {!isMapExpanded && (
          <div
            className={`hidden md:block transition-all shrink-0 ${
              showMap ? "w-[45%]" : "w-0 opacity-0 pointer-events-none"
            }`}>
            <div className="sticky top-[225px] h-[calc(90vh-160px)] overflow-hidden will-change-transform">
              <BusinessMap
                businesses={data}
                currentCity={searchParams.get("city") || ""}
                isVisible={showMap}
                isExpanded={isMapExpanded}
                onToggleExpand={toggleExpand}
              />
            </div>
          </div>
        )}
      </div>

      {isMapExpanded && (
        <div className="px-5 pb-5">
          <div
            className={`${isMapExpanded ? "h-[73vh]" : "h-[calc(80vh-160px)]"} w-full rounded-xl overflow-hidden border`}>
            <BusinessMap
              businesses={data}
              currentCity={searchParams.get("city") || ""}
              isVisible={true}
              isExpanded={true}
              onToggleExpand={toggleExpand}
            />
          </div>
        </div>
      )}
    </div>
  );
}
