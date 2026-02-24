"use client";

import React, { useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Home, LayoutDashboard } from "lucide-react";
import { DealCard } from "./DealCard";
import { DealForm } from "./DealForm";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function DealsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);

  // 1. Fetch Deals
  const { data: deals, isLoading } = useQuery({
    queryKey: ["deals"],
    queryFn: () => fetch("/api/deals").then((res) => res.json()),
  });

  // 2. Mutations
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/deals", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to create deal");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Deal created successfully");
      setIsDialogOpen(false);
    },
  });

  const handleFormSubmit = (values: any) => {
    const formData = new FormData();
    formData.append("title", values.title);
    formData.append("expiryDate", values.expiryDate.toISOString());
    if (values.image) formData.append("image", values.image);

    createMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
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

        {/* Add Deal Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => setSelectedDeal(null)}
              className="bg-orange-600 hover:bg-orange-700 rounded-full px-6">
              <Plus className="mr-2 h-4 w-4" /> Create Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {selectedDeal ? "Edit Deal" : "Add New Deal"}
              </DialogTitle>
            </DialogHeader>
            <DealForm
              initialData={selectedDeal}
              onSubmit={handleFormSubmit}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
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
          {deals?.map((deal: any) => (
            <DealCard
              key={deal._id}
              deal={deal}
              onEdit={(d: any) => {
                setSelectedDeal(d);
                setIsDialogOpen(true);
              }}
              onDelete={(id: string) => {
                toast.info(`Deleting deal ${id}...`);
              }}
            />
          ))}
          {deals?.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-500">
              No deals found. Click Create Deal to get started.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
