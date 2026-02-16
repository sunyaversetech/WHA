'use client';

import type React from 'react';
import { memo } from 'react';

import Link from 'next/link';
import { Calendar, MapPin, Building, Tag, ArrowRight } from 'lucide-react';
import type { FeaturedItem } from '@/lib/types';

interface FeaturedCardProps {
  item: FeaturedItem;
}

const FeaturedCard = memo(function FeaturedCard({ item }: FeaturedCardProps) {
  const handleCardClick = () => {
    const link = getLink(item);
    if (link !== '#') {
      window.location.href = link;
    }
  };

  // Helper to get the correct link for each type
  const getLink = (item: FeaturedItem) => {
    switch (item.type) {
      case 'event':
        return `/events/${item.id}`;
      case 'business':
        return `/businesses/${item.id}`;
      case 'deal':
        return `/deals/${item.id}`;
      default:
        return '#';
    }
  };

  // Get icon and color based on type
  const getTypeInfo = () => {
    switch (item.type) {
      case 'event':
        return {
          icon: Calendar,
          color: 'from-blue-500 to-purple-500',
          label: 'Event',
        };
      case 'business':
        return {
          icon: Building,
          color: 'from-purple-500 to-pink-500',
          label: 'Business',
        };
      case 'deal':
        return {
          icon: Tag,
          color: 'from-green-500 to-emerald-500',
          label: 'Deal',
        };
      default:
        return {
          icon: ArrowRight,
          color: 'from-gray-500 to-gray-600',
          label: 'Featured',
        };
    }
  };

  const typeInfo = getTypeInfo();
  const IconComponent = typeInfo.icon;

  return (
    <div
      className="group relative overflow-hidden rounded-xl cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Full-Image Background */}
      <div className="relative w-full h-56 md:h-60 rounded-xl overflow-hidden group">
        <img
          src={item.image || '/placeholder.svg'}
          alt={item.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

        {/* Type Badge - Top right */}
        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 text-black text-xs px-2 py-1 rounded-md shadow-lg flex items-center space-x-1">
          <IconComponent className="h-3 w-3" />
          <span>{typeInfo.label}</span>
        </div>

        {/* Featured Badge - Top Right */}
        {/* <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-2xl shadow-lg">
          Featured
        </div> */}

        {/* Glassmorphism Overlay - Bottom Portion */}
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <div className="py-2 px-4">
            {/* Main Title */}

            <h3 className="text-sm md:text-base mb-1 md:mb-2 line-clamp-2 text-white leading-tight ">
              {item.title}
            </h3>
            <div className="flex items-center text-sm text-white">
              <MapPin className="w-3 h-3 mr-1  text-white" />
              <span className="line-clamp-1 text-xs">{item.location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FeaturedCard;
