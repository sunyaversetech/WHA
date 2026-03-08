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
  ChevronLeft,
  Dot,
  BadgeCheck,
} from "lucide-react";
import type { Business } from "@/lib/types";
import Image from "next/image";
import { useRouter } from "next/navigation";

const rating = 4;
const totalReviews = 2000;

export default function BusinessCard({ business }: { business: any }) {
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

  const router = useRouter();

  const rating =
    business?.reviews?.reduce(
      (acc: any, review: any) => acc + review.rating,
      0,
    ) ?? 0;
  const totalReviews = business?.reviews?.length ?? "no rating yet";

  const categoryInfo = getCategoryInfo();

  return (
    <div
      className=" overflow-hidden group cursor-pointer"
      onClick={() => router.push(`/businesses/${business._id}`)}>
      <div className="relative w-full h-56 md:h-60 rounded-xl overflow-hidden group">
        <Image
          width={500}
          height={500}
          src={business.image || "/placeholder.svg"}
          alt={business.name}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative z-10 h-full w-full flex flex-col justify-between p-4 text-white">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-1 px-2 py-1 text-xs font-medium rounded-full bg-white text-primary">
              <Building className="w-3 h-3" />
              <span>{categoryInfo.label}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3">
        <div className="flex items-start justify-between gap-3">
          {/* LEFT SIDE */}
          <div className="space-y-1">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 leading-tight">
              {business.business_name}
            </h3>

            <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
              {business.city ?? ""}
            </p>
          </div>

          {/* RIGHT SIDE - RATING */}
          <div className="flex items-center gap-1  px-2.5 py-1 rounded-full border border-yellow-200">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />

            <span className="text-sm font-semibold text-gray-900">
              {rating.toFixed(1)}
            </span>

            <span className="text-xs text-muted-foreground">
              ({totalReviews.toLocaleString()})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
