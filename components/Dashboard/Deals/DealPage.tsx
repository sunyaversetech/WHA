"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Plus, Home, LayoutDashboard } from "lucide-react";
import { DealCard } from "./DealCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { useGetDeals } from "@/services/deal.service";

export default function DealsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetDeals();

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/deals", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to create deal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal created successfully");
    },
  });

  console.log(data);

  const handleFormSubmit = (values: any) => {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("expiryDate", values.expiryDate.toISOString());
    if (values.image) formData.append("image", values.image);

    createMutation.mutate(formData);
  };

  return (
    <div className="mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="flex items-center gap-1">
                <Home className="h-4 w-4" /> Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/dashboard"
                className="flex items-center gap-1">
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>My Deals</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Link
          href="/dashboard/deals/new"
          className="bg-orange-600 flex text-white items-center p-2 hover:bg-orange-700 rounded-full px-6">
          <Plus className="mr-2 h-4 w-4" /> Create Deal
        </Link>
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
