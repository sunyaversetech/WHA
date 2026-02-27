"use client";

import Link from "next/link";
import {
  MapPin,
  Phone,
  Share2,
  Building,
  Star,
  Clock,
  ArrowRight,
} from "lucide-react";
import type { Business } from "@/lib/types";
import Image from "next/image";

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  const getCategoryInfo = () => {
    switch (business.category) {
      case "restaurant":
        return {
          color: "from-red-500 to-orange-500",
          bg: "bg-red-50",
          text: "text-red-600",
          label: "Restaurant",
        };
      case "cafe":
        return {
          color: "from-amber-500 to-yellow-500",
          bg: "bg-amber-50",
          text: "text-amber-600",
          label: "Café",
        };
      case "food-truck":
        return {
          color: "from-orange-500 to-red-500",
          bg: "bg-orange-50",
          text: "text-orange-600",
          label: "Food Truck",
        };
      case "grocery":
        return {
          color: "from-green-500 to-emerald-500",
          bg: "bg-green-50",
          text: "text-green-600",
          label: "Grocery",
        };
      case "salon":
        return {
          color: "from-pink-500 to-purple-500",
          bg: "bg-pink-50",
          text: "text-pink-600",
          label: "Salon",
        };
      case "consultancy":
        return {
          color: "from-blue-500 to-indigo-500",
          bg: "bg-blue-50",
          text: "text-blue-600",
          label: "Consultancy",
        };
      default:
        return {
          color: "from-purple-500 to-pink-500",
          bg: "bg-purple-50",
          text: "text-purple-600",
          label: "Business",
        };
    }
  };

  const categoryInfo = getCategoryInfo();

  const handleCardClick = () => {
    window.location.href = `/businesses/${business.id}`;
  };

  return (
    <div
      className="card overflow-hidden group cursor-pointer"
      onClick={handleCardClick}>
      <div className="relative w-full h-56 md:h-60 rounded-xl overflow-hidden  group">
        <Image
          width={500}
          height={500}
          src={business.image || "/placeholder.svg"}
          alt={business.name}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />

        <div className="relative z-10 h-full w-full flex flex-col justify-between p-4 text-white">
          <div className="flex items-start justify-between">
            <div
              className={`flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded ${categoryInfo.bg} ${categoryInfo.text}`}>
              <Building className="w-3 h-3" />
              <span>{categoryInfo.label}</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0 md:space-x-4 bg-black/10 hover:bg-white/10 rounded-lg p-2 backdrop-blur-sm">
            <div>
              <h3 className="text-sm md:text-md font-bold mb-1">
                {business.name}
              </h3>
              <div className="flex items-center text-sm text-white">
                <MapPin className="w-3 h-3 mr-1  text-white" />
                <span className="line-clamp-1 text-xs">
                  {business.location ?? "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
