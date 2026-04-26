"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Edit,
  ChevronLeft,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { useDeleteEvent, useGetEvent } from "@/services/event.service";
import Image from "next/image";
import Link from "next/link";
import { DeleteConfirmDialog } from "@/components/ui/DynamicDeleteButton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import "@/app/globals.css";

export default function EventsBackend() {
  const { data } = useGetEvent();
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const { mutate, isPending } = useDeleteEvent();
  const queryClient = useQueryClient();
  const router = useRouter();

  const filteredEvents = useMemo(() => {
    if (!data?.data) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return data.data
      .filter((event) => {
        // Use fallback empty string to satisfy TypeScript
        const eventDate = new Date(event.dateRange?.from ?? "");

        // Handle invalid dates (optional but recommended)
        if (isNaN(eventDate.getTime())) return false;

        return activeTab === "upcoming"
          ? eventDate >= today
          : eventDate < today;
      })
      .sort((a, b) => {
        // Use nullish coalescing (?? "") here as well
        const dateA = new Date(a.dateRange?.from ?? "").getTime();
        const dateB = new Date(b.dateRange?.from ?? "").getTime();

        return activeTab === "upcoming" ? dateA - dateB : dateB - dateA;
      });
  }, [data, activeTab]);

  const handleDelete = (id: string) => {
    mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Event deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["event"] });
        },
      },
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto overflow-hidden">
      <Button
        onClick={() => router.back()}
        className="w-8 h-10 rounded-md"
        variant="outline">
        <ChevronLeft className="mr-2 h-8 w-8" />
      </Button>
      <div className="flex gap-4 border-b border-slate-200 w-full">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`pb-2 px-1 w-full font-semibold transition-colors ${activeTab === "upcoming" ? "text-primary border-b-2 border-primary" : "text-slate-500"}`}>
          Upcoming Events
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`pb-2 px-1 w-full font-semibold transition-colors ${activeTab === "past" ? "text-primary border-b-2 border-primary" : "text-slate-500"}`}>
          Past Events
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <div
            key={event._id}
            className="border rounded-lg overflow-hidden shadow hover:shadow-lg transition">
            <div className="relative h-40 w-full">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-lg font-bold">{event.title}</h3>
              <p className="text-sm text-muted-foreground">{event.venue}</p>
              <div className="flex justify-between text-sm">
                <span>
                  {event?.dateRange?.from &&
                    new Date(event?.dateRange?.from).toLocaleDateString(
                      "en-AU",
                      {
                        day: "2-digit",
                        month: "short",
                      },
                    )}
                </span>
                <span>
                  {event.ticket_price ? `$${event.ticket_price}` : "Free"}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 border-t-2 pt-2">
                <Button
                  onClick={() =>
                    router.push(`/dashboard/events/add-event?id=${event._id}`)
                  }
                  variant="ghost">
                  <Edit className="h-4 w-4" />
                </Button>
                <DeleteConfirmDialog
                  onConfirm={() => handleDelete(event._id ?? "")}
                  text={event.title}
                  isPending={isPending}
                />
              </div>
            </div>
          </div>
        ))}
        {filteredEvents.length === 0 && (
          <p className="col-span-full text-center py-10 text-muted-foreground">
            No {activeTab} events found.
          </p>
        )}
      </div>
    </div>
  );
}
