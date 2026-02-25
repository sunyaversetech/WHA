"use client";

import { memo } from "react";
import { Calendar, MapPin, Heart } from "lucide-react";
import { useFavorites } from "@/contexts/favorites-context";
import { useRouter } from "next/navigation";
import Image from "next/image";

const EventCard = memo(function EventCard({ event }: { event: any }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const router = useRouter();

  const eventId = event._id || "";
  const isEventFavorite = isFavorite("events", eventId);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(new Date(dateString));
  };

  // FIX: Handle both 'date' (older records) and 'dateRange' (newer records)
  let dateDisplay = "TBA";
  if (event.dateRange?.from) {
    dateDisplay = `${formatDate(event.dateRange.from)} - ${formatDate(event.dateRange.to)}`;
  } else if (event.date) {
    dateDisplay = formatDate(event.date);
  }

  return (
    <div
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-neutral-100"
      onClick={() => router.push(`/events/${eventId}`)}>
      <div className="relative h-48 w-full">
        <Image
          width={500}
          height={500}
          src={event.image || "/placeholder.svg"}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite("events", eventId);
          }}
          className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors">
          <Heart
            className={`h-4 w-4 ${isEventFavorite ? "fill-primary text-primary" : "text-neutral-600"}`}
          />
        </button>
      </div>

      <div className="p-4">
        <div className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase mb-2">
          {event.category || "Event"}
        </div>

        <h3 className="font-bold text-gray-800 text-lg mb-3 line-clamp-1">
          {event.title}
        </h3>

        <div className="space-y-2">
          <div className="flex items-center text-neutral-600 text-sm">
            <MapPin className="h-3.5 w-3.5 mr-2 text-primary flex-shrink-0" />
            <span className="truncate">{event.venue || "Venue TBA"}</span>
          </div>
          <div className="flex items-center text-neutral-600 text-sm">
            <Calendar className="h-3.5 w-3.5 mr-2 text-primary flex-shrink-0" />
            <span>{dateDisplay}</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <span className="text-xs font-semibold text-neutral-400">
            {event.community || "General"}
          </span>
          <span className="text-sm font-bold text-secondary">
            {event.ticket_price && event.ticket_price > 0
              ? `$${event.ticket_price}`
              : "FREE"}
          </span>
        </div>
      </div>
    </div>
  );
});

export default EventCard;
