"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  Edit,
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
        const eventDate = new Date(event.dateRange?.from ?? "");

        if (isNaN(eventDate.getTime())) return false;

        return activeTab === "upcoming"
          ? eventDate >= today
          : eventDate < today;
      })
      .sort((a, b) => {
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
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-[#051e3a]">Marketing</h1>
          <p className="text-sm text-gray-400 mt-0.5 hidden sm:block">
            Manage your events and promotions
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* Icon-only on mobile, icon + label on sm+ */}
          <Link
            href="/dashboard/events/redemtion-table"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#051e3a] border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
            title="Redemption Table">
            <ExternalLink size={14} />
            <span className="hidden sm:inline">Redemption Table</span>
          </Link>
          <Link
            href="/dashboard/events/verify-event"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#051e3a] border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
            title="Verify Event">
            <ShieldCheck size={14} />
            <span className="hidden sm:inline">Verify Event</span>
          </Link>
          <Link
            href="/dashboard/events/add-event"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold bg-[#051e3a] text-white rounded-full hover:bg-[#082040] transition-colors">
            <PlusCircle size={14} />
            <span>Add Event</span>
          </Link>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`pb-2.5 px-4 text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === "upcoming"
              ? "text-[#051e3a] border-b-2 border-[#051e3a]"
              : "text-gray-400 hover:text-gray-700"
          }`}>
          Upcoming Events
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`pb-2.5 px-4 text-sm font-semibold transition-colors whitespace-nowrap ${
            activeTab === "past"
              ? "text-[#051e3a] border-b-2 border-[#051e3a]"
              : "text-gray-400 hover:text-gray-700"
          }`}>
          Past Events
        </button>
      </div>

      {/* ── Event grid ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredEvents.map((event) => (
          <div
            key={event._id}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
            <div className="relative h-40 w-full">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4 space-y-2">
              <h3 className="text-base font-bold text-[#051e3a] truncate">{event.title}</h3>
              <p className="text-sm text-gray-500 truncate">{event.venue}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">
                  {event?.dateRange?.from &&
                    new Date(event.dateRange.from).toLocaleDateString("en-AU", {
                      day: "2-digit",
                      month: "short",
                    })}
                </span>
                <span className="font-semibold text-[#051e3a]">
                  {event.ticket_price ? `$${event.ticket_price}` : "Free"}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Button
                  onClick={() =>
                    router.push(`/dashboard/events/add-event?id=${event._id}`)
                  }
                  variant="ghost"
                  size="sm"
                  className="text-[#051e3a]">
                  <Edit className="h-4 w-4 mr-1" /> Edit
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
          <div className="col-span-full py-16 text-center">
            <p className="text-gray-400 text-sm">
              No {activeTab} events found.
            </p>
            <Link
              href="/dashboard/events/add-event"
              className="mt-4 inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#051e3a] text-white text-sm font-bold hover:bg-[#082040] transition-colors">
              <PlusCircle size={14} /> Create your first event
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
