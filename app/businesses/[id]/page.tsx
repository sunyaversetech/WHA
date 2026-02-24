"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { use } from "react";
import { getBusinessById } from "@/lib/data/businesses";
import { getDealsByBusinessId } from "@/lib/data/deals";
import { BadgeCheck, ChevronLeft, Star, Dot } from "lucide-react";

import {
  MapPin,
  Phone,
  Globe,
  Clock,
  Share2,
  ExternalLink,
  ArrowLeft,
  Tag,
  Sparkles,
  Building,
  LucideCaptions,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import DealCard from "@/components/cards/deal-card";

const BusinessMap = dynamic(() => import("@/components/business-map"), {
  ssr: false,
});

export default function BusinessDetailPage({
  params,
}: {
  params: { id: string };
}) {
  let unwrappedParams: { id: string };
  if (isPromise(params)) {
    unwrappedParams = use(params) as { id: string };
  } else {
    unwrappedParams = params;
  }
  const business = getBusinessById(unwrappedParams.id);
  const [activeTab, setActiveTab] = useState<"about" | "deals">("about");

  if (!business) {
    notFound();
  }

  // Get deals for this business
  const businessDeals = getDealsByBusinessId(unwrappedParams.id);

  // Determine category label and color
  const getCategoryInfo = () => {
    switch (business.category) {
      case "restaurant":
        return { label: "Restaurant", color: "bg-red-500" };
      case "cafe":
        return { label: "Café", color: "bg-amber-500" };
      case "food-truck":
        return { label: "Food Truck", color: "bg-orange-500" };
      case "grocery":
        return { label: "Grocery Store", color: "bg-green-500" };
      case "salon":
        return { label: "Salon", color: "bg-pink-500" };
      case "consultancy":
        return { label: "Consultancy", color: "bg-blue-500" };
      case "automotive":
        return { label: "Automotive", color: "bg-gray-500" };
      case "event":
        return { label: "Event", color: "bg-gray-500" };
      default:
        return { label: "Business", color: "bg-purple-500" };
    }
  };

  const categoryInfo = getCategoryInfo();

  const rating = 4;
  const totalReviews = 2000;

  function isPromise<T>(value: any): value is Promise<T> {
    return !!value && typeof value.then === "function";
  }

  return (
    <div className="container-modern min-h-screen bg-gradient-modern relative">
      {/* Back Button */}
      <div className="flex items-center justify-start gap-2 p-4 -ml-4">
        <Link href="/businesses" aria-label="Back to events">
          <ChevronLeft
            className="h-8 w-8 cursor-pointer rounded-full border bg-white p-1.5 
               text-slate-600 
               transition-all hover:scale-105 active:scale-95"
          />
        </Link>
        <h3 className="text-lg font-semibold text-gray-800">Businesses</h3>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-3 ">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {business.name}
          </h1>
          <h1>
            <BadgeCheck className="text-green" />
          </h1>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm text-muted-foreground">
          {/* Rating Section */}
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">
              {rating.toFixed(1)}
            </span>

            <div className="flex gap-1">
              {[...Array(5)].map((_, index) => (
                <Star
                  key={index}
                  className={`h-4 w-4 ${
                    index < rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>

            <span>({totalReviews.toLocaleString()})</span>
          </div>

          {/* Divider */}
          <Dot className="hidden md:block h-4 w-4" />

          {/* Status */}
          <div className="font-medium text-red-500">Closed - Opens 9:00 am</div>

          {/* Divider */}
          <Dot className="hidden md:block h-4 w-4" />

          {/* Location */}
          <div>Kingston, Canberra</div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative  h-[30vh] lg:h-[60vh] w-full  rounded-xl mt-5">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-transparent z-10 rounded-xl"></div>
        <img
          src={business.image || "/placeholder.svg"}
          alt={business.name}
          className="w-full h-full object-cover rounded-xl"
        />
      </div>

      {/* Content Section */}
      <div className="container-modern py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="card-lg p-4 md:p-6 mb-6">
              <div className="flex space-x-1 mb-6 bg-gray-100/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("about")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === "about"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                  }`}
                >
                  About
                </button>
                <button
                  onClick={() => setActiveTab("deals")}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === "deals"
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-800 hover:bg-white/50"
                  }`}
                >
                  Deals ({businessDeals.length})
                </button>
              </div>

              {/* Tab Content */}
              {activeTab === "about" ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      {business.name}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {business.description}
                    </p>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Contact Information
                    </h3>
                    <div className="space-y-3">
                      {business.phone && (
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Phone className="h-4 w-4 text-blue-600" />
                          </div>
                          <a
                            href={`tel:${business.phone}`}
                            className="text-gray-700 hover:text-blue-600 transition-colors"
                          >
                            {business.phone}
                          </a>
                        </div>
                      )}
                      {business.website && (
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Globe className="h-4 w-4 text-green-600" />
                          </div>
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-700 hover:text-green-600 transition-colors flex items-center space-x-1"
                          >
                            <span>{business.website}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <MapPin className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-gray-700">
                          {business.location}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Business Hours */}
                  {business.hours && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-3">
                        Business Hours
                      </h3>
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <Clock className="h-4 w-4 text-amber-600" />
                        </div>
                        <span className="text-gray-700">{business.hours}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {businessDeals.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      {businessDeals.map((deal) => (
                        <DealCard key={deal.id} deal={deal} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No deals available
                      </h3>
                      <p className="text-gray-500">
                        This business doesn`t have any active deals at the
                        moment.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="card p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="w-full btn-secondary flex items-center justify-center space-x-2"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Call Now</span>
                  </a>
                )}
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full btn-secondary flex items-center justify-center space-x-2"
                  >
                    <Globe className="h-4 w-4" />
                    <span>Visit Website</span>
                  </a>
                )}
                <button className="w-full btn-secondary flex items-center justify-center space-x-2">
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Location */}
            <div className="card p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Location
              </h3>
              <div className="h-48 rounded-lg overflow-hidden">
                <BusinessMap businesses={[business]} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
