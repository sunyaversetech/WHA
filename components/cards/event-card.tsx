"use client";

import { memo } from "react";
import { Calendar, MapPin, Heart, Loader2, Ticket } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  useCreateFavroite,
  useGetUserFavroite,
} from "@/services/favroite.service";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { EventFormValues } from "../Dashboard/Events/EventsForm";
import { useAuthModal } from "../Auth/DialogLogin/use-auth-model";

const EventCard = memo(function EventCard({
  event,
}: {
  event: EventFormValues;
}) {
  const router = useRouter();
  const { onOpen } = useAuthModal();
  const { mutate, isPending } = useCreateFavroite();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const slug = event.title.toLowerCase().replace(/[^a-z0-9]/g, "");
  const eventId = event._id || "";

  const formatDate = (dateInput: string | Date) => {
    if (!dateInput) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(typeof dateInput === "string" ? new Date(dateInput) : dateInput);
  };

  let dateDisplay = "TBA";
  if (event.dateRange?.from) {
    dateDisplay = `${formatDate(event.dateRange.from)}  ${event.dateRange.to !== event.dateRange.from ? `- ${event.dateRange.to && formatDate(event.dateRange.to)}` : ""}`;
  }

  const handleAddRemoveFavorite = () => {
    if (!session) {
      onOpen();
      return;
    }
    mutate(
      { item_id: eventId, item_type: "Event" },
      {
        onSuccess: (msg) => {
          router.refresh();
          toast.success(msg.message);
          queryClient.invalidateQueries({ queryKey: ["favroite"] });
        },
        onError: () => {
          toast.error("Failed to add to favorites");
        },
      },
    );
  };

  const { data: userFavorites } = useGetUserFavroite();

  const isEventFavorite = userFavorites?.data?.events?.some(
    (item) => (item._id ?? "").toString() === eventId?.toString(),
  );

  return (
    <div
      className="group relative overflow-hidden rounded-lg cursor-pointer"
      onClick={() => router.push(`/events/${slug}`)}>
      <div className="relative h-56 md:h-60 w-full">
        <Image
          width={500}
          height={500}
          src={event.image || "/placeholder.svg"}
          alt={event.title}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        <div className="absolute top-3 left-3 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold px-2 py-1 rounded-lg shadow-lg">
          {event.category
            ? event.category.charAt(0).toUpperCase() + event.category.slice(1)
            : "Event"}
        </div>

        <button
          disabled={isPending}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleAddRemoveFavorite();
          }}
          className="absolute top-3 right-3 p-2 bg-black/10 backdrop-blur-md border border-white/30 rounded-full
           transition-colors duration-200 shadow-lg group/fav hover:bg-white/30 disabled:opacity-70">
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            <Heart
              className={`h-5 w-5 transition-colors duration-200 ${
                isEventFavorite
                  ? "text-red-500 fill-red-500"
                  : "text-white group-hover/fav:text-primary"
              }`}
            />
          )}
        </button>

        <div className="absolute bottom-0 left-0 right-0 bg-black/10 backdrop-blur-sm border-t border-white/20">
          <div className="py-3 px-4 md:p-4">
            <h3 className="text-white font-bold text-sm md:text-md line-clamp-2 mb-2 md:mb-3 leading-tight">
              {event.title}
            </h3>

            <div className="flex items-center justify-between text-white/90 text-sm">
              <div className="space-x-6 max-w-[70%]">
                <div className="flex items-center truncate pb-1">
                  <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                  <span className="truncate text-xs md:text-sm">
                    {event.venue || "Venue TBA"}
                  </span>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                  <span className="truncate text-xs md:text-sm">
                    {dateDisplay}
                  </span>
                </div>
              </div>

              {event.price_category === "paid" ? (
                <a
                  href={event.ticket_link || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2 py-1 md:px-3 md:py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg hover:bg-white/30 transition-colors duration-200">
                  <Ticket className="h-4 w-4 text-white" />
                  <span className="text-white font-medium md:text-sm">
                    Ticket
                  </span>
                </a>
              ) : (
                <div className="flex items-center gap-2 px-2 py-1 md:px-3 md:py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-md transition-colors duration-200">
                  <Ticket className="h-4 w-4 text-white" />
                  <span className="text-white font-medium md:text-sm">
                    FREE
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default EventCard;
