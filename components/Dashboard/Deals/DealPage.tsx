"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Plus,
  Home,
  LayoutDashboard,
  ChevronLeft,
  PlusCircle,
} from "lucide-react";
import { DealCard } from "./DealCard";
import { toast } from "sonner";
import Link from "next/link";
import { useGetDeals } from "@/services/deal.service";
import { useRouter } from "next/navigation";

export default function DealsPage() {
  const { data, isLoading } = useGetDeals();
  const router = useRouter();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-start justify-between md:hidden">
        <ChevronLeft
          onClick={() => router.back()}
          className="h-10 w-10 cursor-pointer rounded-full hover:border hover:bg-white p-1 -ml-2
               text-[#ODODOD] 
               transition-all hover:scale-105 active:scale-95"
        />
        <Link
          href="/dashboard/deals/new"
          className="ml-auto flex bg-[#041e3a] text-sm text-white items-center py-2 px-4 rounded-full hover:bg-slate-100 hover:text-[#041e3a] border hover:border-[#041e3a] transition-colors duration-200"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl text-secondary  font-bold tracking-tight">
            Deals dashboard
          </h1>
          <p className="text-muted">
            View and manage the deals offered by your business.
          </p>
        </div>

        <div className="hidden md:block">
          <Link
            href="/dashboard/deals/new"
            className="ml-auto flex bg-[#041e3a]  text-white items-center py-2 px-6 rounded-full hover:bg-slate-100 hover:text-[#041e3a] border hover:border-[#041e3a] transition-colors duration-200"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add
          </Link>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* Deals Grid Mapping */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[400px] w-full animate-pulse bg-slate-100 rounded-3xl"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {data?.data?.map((deal: any) => (
            <DealCard
              key={deal._id}
              deal={deal}
              onDelete={(id: string) => {
                toast.info(`Deleting deal ${id}...`);
              }}
            />
          ))}
          {data?.data?.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-500">
              No deals found. Click Create Deal to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
