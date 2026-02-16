'use client';

import type React from 'react';
import { memo } from 'react';

import Link from 'next/link';
import { Calendar, MapPin, Heart, Ticket } from 'lucide-react';
import type { Event } from '@/lib/types';
import { useFavorites } from '@/contexts/favorites-context';

interface EventCardProps {
  event: Event;
}

const EventCard = memo(function EventCard({ event }: EventCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isEventFavorite = isFavorite('events', event.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite('events', event.id);
  };

  const handleCardClick = () => {
    window.location.href = `/events/${event.id}`;
  };

  return (
    <div
      className="group relative overflow-hidden rounded-lg  cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Full-Image Background */}
      <div className="relative h-56 md:h-60  w-full">
        <img
          src={event.image || '/placeholder.svg'}
          alt={event.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        {/* Category Badge - Top Left */}
        <div className="absolute top-4 left-4 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold px-2 py-1 rounded-lg shadow-lg">
          {event.category
            ? event.category.charAt(0).toUpperCase() + event.category.slice(1)
            : 'Event'}
        </div>
        {/* Favorite Button */}
        {/* AFTER: Favorite button moved to top-right */}
        <div className="absolute top-4 right-4 flex-shrink-0">
          <button
            onClick={handleFavoriteClick}
            className={`p-2 bg-black/10 backdrop-blur-md border border-white/30 rounded-xl transition-colors duration-200 shadow-lg group/fav hover:bg-white/30 ${
              isEventFavorite ? 'bg-primary/30 border-primary/50' : ''
            }`}
          >
            <Heart
              className={`h-5 w-5 transition-colors duration-200 ${
                isEventFavorite
                  ? 'text-primary fill-primary'
                  : 'text-white group-hover/fav:text-primary'
              }`}
            />
          </button>
        </div>
        {/* Ticket Button - Top Right */}
        {/* {event.ticketUrl ? (
          <a
            href={event.ticketUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl hover:bg-white/30 transition-colors duration-200 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <Ticket className="h-4 w-4 text-white" />
            <span className="text-white font-medium text-sm">Buy Ticket</span>
          </a>
        ) : (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl transition-colors duration-200">
            <Ticket className="h-4 w-4 text-white" />
            <span className="text-white font-medium text-sm">Free</span>
          </div>
        )} */}
        {/* Glassmorphism Overlay - Bottom Portion */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/10 backdrop-blur-sm border-t border-white/20">
          <div className="py-2 px-4 md:p-4">
            {/* Main Title */}
            <h3 className="text-sm md:text-md font-bold mb-2 md:mb-3 line-clamp-2 text-white leading-tight">
              {event.title}
            </h3>

            <div className="flex items-center justify-between text-white/90 text-sm">
              {/* Meta Info Row */}
              <div className=" space-x-6 truncate max-w-[70%]">
                <div className="flex items-center truncate pb-1">
                  <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                  <span className="truncate text-xs md:text-sm">
                    {event.venue}
                  </span>
                </div>

                <div className="flex items-center !ml-0">
                  <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                  <span className="truncate text-xs md:text-sm">
                    {event.date}
                  </span>
                </div>
              </div>

              {/* Ticket button moved to bottom-right */}
              {event.ticketUrl ? (
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2 py-1 md:px-3 md:py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-lg hover:bg-white/30 transition-colors duration-200 cursor-pointer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Ticket className="h-4 w-4 text-white" />
                  <span className="text-white font-medium md:text-sm">
                    Ticket
                  </span>
                </a>
              ) : (
                <div className="flex items-center gap-2 px-2 py-1 md:px-3 md:py-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl transition-colors duration-200">
                  <Ticket className="h-4 w-4 text-white" />
                  <span className="text-white font-medium text-sm">Free</span>
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
