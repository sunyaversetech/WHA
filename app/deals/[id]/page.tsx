'use client';

import { useState } from 'react';
import { use } from 'react';
import { getDealById } from '@/lib/data/deals';
import {
  Calendar,
  Store,
  Share2,
  Check,
  QrCode,
  ArrowLeft,
  MapPin,
  Sparkles,
  Tag,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useFavorites } from '@/contexts/favorites-context';
import { useRedeem } from '@/contexts/redeem-context';
import { getBusinessById } from '@/lib/data/businesses';

function isPromise<T>(value: any): value is Promise<T> {
  return !!value && typeof value.then === 'function';
}

export default function DealDetailPage({ params }: { params: { id: string } }) {
  let unwrappedParams: { id: string };
  if (isPromise(params)) {
    unwrappedParams = use(params) as { id: string };
  } else {
    unwrappedParams = params;
  }

  const deal = getDealById(unwrappedParams.id);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isDealRedeemed, redeemDeal } = useRedeem();
  const [redemptionResult, setRedemptionResult] = useState<{
    success: boolean;
    message: string;
    code?: string;
  } | null>(null);

  if (!deal) {
    notFound();
    return null;
  }

  const business = deal?.businessId ? getBusinessById(deal.businessId) : null;
  const alreadyRedeemed = deal ? isDealRedeemed(deal.id) : false;
  const isDealFavorite = isFavorite('deals', deal.id);

  const handleRedeemComplete = async () => {
    if (!deal) return;
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));

    redeemDeal(deal.id);

    // Generate a "What's Happening" code
    const code = deal.coupon;

    setRedemptionResult({
      success: true,
      message: 'Deal redeemed successfully!',
      code,
    });
  };

  const handleFavoriteClick = () => {
    toggleFavorite('deals', deal.id);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button - Fixed Position */}
      <div className="fixed top-20 left-5 z-30">
        <Link
          href="/deals"
          className="glass text-gray-700 hover:text-blue-600 p-2 rounded-lg shadow-md transition-colors flex items-center justify-center"
          aria-label="Back to events"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      {/* Main Content */}
      <div className="container-modern py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Main Deal Section */}
          <div className="relative w-full bg-white rounded-xl overflow-hidden shadow-lg">
            {/* Ticket Notches */}
            <div className="absolute top-1/2 -left-2 w-4 h-4 bg-gray-100 rounded-full transform -translate-y-1/2 z-0"></div>
            <div className="absolute top-1/2 -right-2 w-4 h-4 bg-gray-100 rounded-full transform -translate-y-1/2 z-0"></div>

            {/* Content */}
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                {/* Deal Title and Description */}
                <div className="flex-1">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                    {deal.title}
                  </h1>
                  <p className="text-gray-600 text-base md:text-lg leading-relaxed">
                    {deal.description}
                  </p>
                </div>

                {/* Favorite Button */}
                <button
                  onClick={handleFavoriteClick}
                  className={`p-2 rounded-lg transition-all duration-200 self-start ${
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

              {/* Business Information */}
              {business && (
                <div className="mb-6">
                  <Link
                    href={`/businesses/${deal.businessId}`}
                    className="block border border-gray-200 hover:bg-gray-50 rounded-lg p-4 -m-4 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                          <img
                            src={business.image || '/placeholder.svg'}
                            alt={`${business.name} logo`}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                          {business.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {business.location || business.city}
                          </p>
                        </div>
                        {business.phone && (
                          <p className="text-sm text-gray-500 mt-1">
                            📞 {business.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* Deal details */}
              {deal.details && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Deal Details
                  </h3>
                  <div
                    dangerouslySetInnerHTML={{ __html: deal.details }}
                    className="text-gray-600 leading-relaxed"
                  />
                </div>
              )}

              {/* Dotted Line Separator */}
              <div className="border-t-2 border-dashed border-gray-200 my-6"></div>

              {/* Redemption Section */}
              <div className="text-center">
                {redemptionResult?.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium text-lg">
                        Successfully Redeemed!
                      </span>
                    </div>
                    <p className="text-green-700 text-sm mb-4">
                      Show this code to the business:
                    </p>
                    <div className="bg-white border border-green-300 rounded-lg p-4 mb-3">
                      <code className="text-xl font-mono font-bold text-green-800">
                        {redemptionResult.code}
                      </code>
                    </div>
                    <p className="text-green-700 text-xs">
                      Code expires when deal expires
                    </p>
                  </div>
                ) : alreadyRedeemed ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="text-green-800 font-medium text-lg">
                        Already Redeemed
                      </span>
                    </div>
                    <p className="text-green-700 text-sm">
                      You've already claimed this deal
                    </p>
                    {/* Show the redemption code even if already redeemed */}
                    {deal.coupon && (
                      <div className="mt-4">
                        <p className="text-green-700 text-sm mb-2">
                          Your redemption code:
                        </p>
                        <div className="bg-white border border-green-300 rounded-lg p-3">
                          <code className="text-lg font-mono font-bold text-green-800">
                            {deal.coupon}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handleRedeemComplete}
                      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                    >
                      Redeem Deal
                    </button>
                    <p className="text-gray-500 text-sm mt-3">
                      Click to claim your exclusive offer
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Deal Information - Separate Box */}
          <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Deal Information
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Tag className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium text-gray-900">
                    {deal.category
                      ? deal.category.charAt(0).toUpperCase() +
                        deal.category.slice(1)
                      : 'Deal'}
                  </p>
                </div>
              </div>

              {deal.expiryDate && (
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valid Until</p>
                    <p className="font-medium text-gray-900">
                      {deal.expiryDate}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Terms and Conditions */}
            {deal.terms && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-md font-semibold text-gray-900 mb-3">
                  Terms & Conditions
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {deal.terms}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notice: Platform in Development */}
      <div className="container-modern pb-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-yellow-500/20 rounded-xl flex-shrink-0">
                <Sparkles className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">
                  Platform in Development
                </h3>
                <p className="text-yellow-700 text-sm">
                  Information may be outdated. Please check official business
                  sites for up-to-date details.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
