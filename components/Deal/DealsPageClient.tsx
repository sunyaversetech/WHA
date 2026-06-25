"use client";

import { Tag } from "lucide-react";
import { useGetAllDeals } from "@/services/deal.service";
import DealCard from "@/components/cards/deal-card";
import DealsHeader from "./DealFilter";
import FilterPanel from "@/components/ResuableComponents/FilterPanel";
import { Skeleton } from "../ui/skeleton";
import { useSearchParams } from "next/navigation";

export default function DealsPageClient() {
  const { data: deals, isLoading, isFetching } = useGetAllDeals();
  const searchParams = useSearchParams();
  const currentDate = new Date();

  const data = deals?.data?.filter(
    (deal) => currentDate <= new Date(deal.valid_till),
  );

  const isActuallyLoading = isLoading || (!deals && isFetching);
  const cityLabel = searchParams.get("city") ?? "Australia";

  return (
    <div className="flex flex-col min-h-screen pt-20 md:pt-40">

      {/* ── Toolbar ── */}
      <div className="sticky top-[76px] md:top-[156px] z-40 bg-white border-b border-border px-4 md:px-6 py-3 flex items-center justify-between gap-3">
        <p className="text-xs md:text-sm font-medium text-muted-foreground">
          {!isActuallyLoading && (
            <>
              <span className="font-bold text-primary">{data?.length ?? 0}</span>{" "}
              deal{(data?.length ?? 0) !== 1 ? "s" : ""} in {cityLabel}
            </>
          )}
        </p>

        <FilterPanel title="Filter Deals" categoriesContent={<DealsHeader />} />
      </div>

      {/* ── Content ── */}
      <div className="px-4 md:px-6 py-4 pb-20">
        {isActuallyLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        ) : data && data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.map((deal) => (
              <DealCard key={deal._id} deal={deal} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-5 bg-muted rounded-full mb-4">
              <Tag className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-bold text-primary mb-1">No deals found</h3>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or check back later for new deals.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
