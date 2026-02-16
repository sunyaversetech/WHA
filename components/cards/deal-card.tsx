'use client';

import type React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useFavorites } from '@/contexts/favorites-context';
import { useRedeem } from '@/contexts/redeem-context';
import { Heart, Check, MapPin, Calendar, QrCode } from 'lucide-react';
import type { Deal } from '@/lib/types';
import { getBusinessById } from '@/lib/data/businesses';

interface DealCardProps {
  deal: Deal;
}

export default function DealCard({ deal }: DealCardProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isDealRedeemed } = useRedeem();

  const isDealFavorite = isFavorite('deals', deal.id);
  const alreadyRedeemed = isDealRedeemed(deal.id);

  // Get business information using businessId
  const business = deal.businessId ? getBusinessById(deal.businessId) : null;
  const businessName = business?.name || deal.business;
  const businessLocation =
    business?.location || business?.city || deal.city || 'Local Business';
  const businessImage = business?.image || deal.image || '/placeholder.svg';

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopPropagation();
    toggleFavorite('deals', deal.id);
  };

  return (
    <Link href={`/deals/${deal.id}`} className="block">
      <div className="relative w-full bg-gray-200 rounded-lg overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-300 active:scale-95">
        {/* Ticket Notches */}
        <div className="absolute top-1/2 -left-2 w-4 h-4 bg-white border border-gray-200 rounded-full transform -translate-y-1/2 z-0"></div>
        <div className="absolute top-1/2 -right-2 w-4 h-4 bg-white border border-gray-200 rounded-full transform -translate-y-1/2 z-0"></div>

        {/* Content - Horizontal Layout */}
        <div className="flex px-4 py-2 gap-4">
          {/* Content Section */}
          <div className="flex-grow">
            {/* Deal Info */}
            <div className="mb-1 md:mb-2 flex justify-between items-center">
              <div>
                <h3 className="text-sm md:text-md font-semibold text-gray-900">
                  {deal.title}
                </h3>
                <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">
                  {deal.description}
                </p>
              </div>
              {/* Favorite Button */}
              <button
                onClick={handleFavoriteClick}
                className={`self-start p-2  rounded-lg transition-all duration-200 ${
                  isDealFavorite
                    ? 'text-red-500 bg-red-50'
                    : 'text-gray-400 bg-gray-100 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <Heart
                  className={`h-5 w-5 ${isDealFavorite ? 'fill-current' : ''}`}
                />
              </button>
            </div>

            {/* Business Info with Logo - Now Clickable */}
            {deal.businessId ? (
              <div className="flex items-start gap-3 rounded-lg p-2 -m-2 transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <img
                      src={businessImage}
                      alt={`${businessName} logo`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-sm md:text-md font-bold text-gray-900 ">
                    {businessName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {businessLocation}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                    <img
                      src={businessImage}
                      alt={`{businessName} logo`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {businessName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {businessLocation}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Section with Expiry and Claim Button */}
            <div className="mt-3  relative">
              {/* Dotted divider line */}
              <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
                <div className="border-t-2 border-dashed border-gray-200 w-full"></div>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center text-xs text-gray-500 mt-1">
                  <Calendar className="h-3 w-3 mr-1" />
                  <span>Expires {deal.expiryDate}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  {/* Claim Button - Now shows state but doesn't handle redemption */}
                  {alreadyRedeemed ? (
                    <div className="px-3 py-1.5 bg-primary/10 rounded-sm text-sm font-medium text-primary flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Redeemed
                    </div>
                  ) : (
                    <div className="px-2 py-1 bg-secondary/10 rounded-sm text-xs md:text-sm font-medium text-secondary flex items-center gap-1">
                      Claim
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
