"use client";

import { useState } from "react";
import { SlidersVertical, Globe, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

const COMMUNITIES = [
  { name: "All", value: "All", icon: Globe },
  { name: "Australian", value: "Australian", icon: MapPin },
  { name: "Nepali", value: "Nepali", icon: MapPin },
];

interface FilterPanelProps {
  title: string;
  categoriesContent: React.ReactNode;
}

export default function FilterPanel({
  title,
  categoriesContent,
}: FilterPanelProps) {
  const [currentCommunity, setCurrentCommunity] = useState("All");
  const searchParams = useSearchParams();
  const router = useRouter();

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

  const FilterContent = () => (
    <Tabs defaultValue="categories" className="w-full">
      <TabsList className="w-full rounded-none border-b border-border bg-transparent h-auto p-0">
        <TabsTrigger
          value="categories"
          className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary
                     data-[state=active]:text-primary data-[state=active]:shadow-none
                     py-3 font-semibold text-sm bg-transparent"
        >
          Categories
        </TabsTrigger>
        <TabsTrigger
          value="communities"
          className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary
                     data-[state=active]:text-primary data-[state=active]:shadow-none
                     py-3 font-semibold text-sm bg-transparent"
        >
          Community
        </TabsTrigger>
      </TabsList>

      <TabsContent value="categories" className="pt-4">
        {categoriesContent}
      </TabsContent>

      <TabsContent value="communities" className="pt-4">
        <div className="flex flex-wrap gap-2">
          {COMMUNITIES.map((com) => {
            const Icon = com.icon;
            const isActive = currentCommunity === com.value;
            return (
              <Button
                key={com.value}
                variant="outline"
                onClick={() => {
                  updateQuery({
                    community: com.value === "All" ? null : com.value,
                  });
                  setCurrentCommunity(com.value);
                }}
                className={`flex items-center gap-2 h-10 px-4 rounded-full border font-semibold text-sm transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-muted-foreground border-border hover:border-primary hover:text-primary"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {com.name}
              </Button>
            );
          })}
        </div>
      </TabsContent>
    </Tabs>
  );

  return (
    <>
      {/* Mobile: Drawer */}
      <Drawer>
        <DrawerTrigger asChild className="flex md:hidden">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full font-semibold"
          >
            <SlidersVertical className="h-3.5 w-3.5 mr-1.5" />
            Filters
          </Button>
        </DrawerTrigger>
        <DrawerContent className="max-w-4xl w-full min-h-[50vh] p-5">
          <DrawerTitle className="text-base font-bold mb-4">
            {title}
          </DrawerTitle>
          {FilterContent()}
        </DrawerContent>
      </Drawer>

      {/* Desktop: Dialog */}
      <Dialog>
        <DialogTrigger asChild className="hidden md:flex">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full font-semibold"
          >
            <SlidersVertical className="h-3.5 w-3.5 mr-1.5" />
            Filters
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl w-full p-6">
          <DialogTitle className="text-base font-bold mb-4">
            {title}
          </DialogTitle>
          {FilterContent()}
        </DialogContent>
      </Dialog>
    </>
  );
}
