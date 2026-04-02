"use client";

import DealCard from "@/components/cards/deal-card";

import { Calendar, Filter, Map, Tag } from "lucide-react";
import { useGetAllDeals } from "@/services/deal.service";
import DealsHeader from "./DealFilter";
import { Skeleton } from "../ui/skeleton";
import DealsSearchWithDates from "../ResuableComponents/SearchSectionForDeals";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { useSearchParams } from "next/navigation";
import { Separator } from "../ui/separator";

export default function DealsPageClient() {
  const { data: deals, isLoading } = useGetAllDeals();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") || "list";
  const currentDate = new Date();
  const data =
    deals?.data &&
    deals?.data?.filter((deal) => currentDate <= new Date(deal.valid_till));

  return (
    <div className="min-h-screen bg-gradient-modern relative -mt-2 max-xl:px-6">
      <DealsSearchWithDates />
      <Separator />
      <div className="relative z-10">
        <div className="container-modern  md:py-6">
          {/* <DealsHeader /> */}
          <div className="flex items-end justify-end ">
            <Dialog>
              {view === "list" && (
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 rounded-md btn-wha-outline h-12 mr-2">
                    <Filter className="h-4 w-4" />
                    Filter
                  </Button>
                </DialogTrigger>
              )}
              <DialogContent className="max-w-4xl w-full">
                <DialogTitle className="text-lg font-bold mb-4">
                  Filter Deals
                </DialogTitle>
                <DealsHeader />
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className="container-modern pb-8">
          {isLoading ? (
            <div className="flex  items-center gap-2 mt-5">
              <Skeleton className="h-72 w-96 mb-4 animate-pulse rounded-xl" />
              <Skeleton className="h-72 w-96 mb-4 animate-pulse" />
              <Skeleton className="h-72 w-96 mb-4 animate-pulse" />
            </div>
          ) : data && data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6 max-xl:mt-2">
              {data.map((deal) => (
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
