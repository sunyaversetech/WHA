"use client";

import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, ChevronLeft } from "lucide-react";
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
  const { mutate, isPending } = useDeleteEvent();
  const queryClient = useQueryClient();
  const router = useRouter();
  const handleDelete = (id: string) => {
    mutate(
      { id },
      {
        onSuccess: () => {
          toast.success("Event deleted successfully");
          queryClient.invalidateQueries({ queryKey: ["event"] });
          queryClient.invalidateQueries({ queryKey: ["favorite"] });
        },
        onError: (error: any) => {
          toast.error(
            error.response?.data?.message || "Failed to delete event",
          );
        },
      },
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto no-scrollbar">
      <div className="flex items-start justify-between no-scrollbar md:hidden">
        <ChevronLeft
          onClick={() => router.back()}
          className="h-10 w-10 cursor-pointer rounded-full  p-1 -ml-2
               text-[#ODODOD] 
               transition-all hover:scale-105 active:scale-95"
        />
        <Link
          href="/dashboard/events/add-event"
          className="ml-auto flex bg-[#041e3a] text-sm text-white items-center py-2 px-4 rounded-full hover:bg-slate-100 hover:text-[#041e3a] border hover:border-[#041e3a] transition-colors duration-200">
          <PlusCircle className="mr-2 h-4 w-4" /> Add
        </Link>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl text-secondary  font-bold tracking-tight">
            Events dashboard
          </h1>
          <p className="text-muted">
            View and manage the event offered by your business.
          </p>
        </div>

        <div className="hidden md:block">
          <Link
            href="/dashboard/events/add-event"
            className="ml-auto flex bg-[#041e3a]  text-white items-center py-2 px-6 rounded-full hover:bg-slate-100 hover:text-[#041e3a] border hover:border-[#041e3a] transition-colors duration-200">
            <PlusCircle className="mr-2 h-4 w-4" /> Add
          </Link>
        </div>
      </div>

      <hr className="border-slate-200" />

      {/* new  */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data?.data?.map((event) => (
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

              <div className="flex justify-between">
                <p className="text-sm">
                  {event?.dateRange?.from
                    ? new Intl.DateTimeFormat("en-AU", {
                        day: "2-digit",
                        month: "short",
                      }).format(new Date(event?.dateRange?.from))
                    : ""}{" "}
                  {event?.dateRange?.from !== event?.dateRange?.to &&
                  event?.dateRange?.to
                    ? `to ${new Intl.DateTimeFormat("en-AU", {
                        day: "2-digit",
                        month: "short",
                      }).format(new Date(event?.dateRange?.to))}`
                    : ""}
                </p>
                <p className="text-sm">
                  {event.ticket_price ? `$${event.ticket_price}` : "Free"}
                </p>
              </div>

              <p className="text-xs text-muted-foreground">{event.location}</p>
              <div className="flex justify-between items-center mt-2 border-t-2">
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
      </div>
    </div>
  );
}
