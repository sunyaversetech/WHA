"use client";

import { memo } from "react";

import { Calendar, MapPin, Building } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const FeaturedCard = memo(function FeaturedCard({ item }: any) {
  const router = useRouter();
  const getTypeInfo = () => {
    switch (item.category) {
      case "business":
        return {
          icon: Building,
          color: "from-purple-500 to-pink-500",
          label: "Business",
        };
      default:
        return {
          icon: Calendar,
          color: "from-blue-500 to-purple-500",
          label: "Featured",
        };
    }
  };

  const typeInfo = getTypeInfo();
  const IconComponent = typeInfo.icon;

  const slug = item?.business_name?.toLowerCase().replace(/[^a-z0-9]/g, "");
  const eventslug = item?.title?.toLowerCase().replace(/[^a-z0-9]/g, "");

  return (
    <div
      className="group relative overflow-hidden rounded-xl cursor-pointer"
      onClick={
        item.category === "business"
          ? () => router.push(`/businesses/${slug}`)
          : () => router.push(`/events/${eventslug}`)
      }>
      <div className="relative w-full h-56 md:h-60 rounded-xl overflow-hidden group">
        <Image
          width={500}
          height={500}
          src={item.image || "/placeholder.svg"}
          alt={"WhatsHappeningAustralia"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 text-black text-xs px-2 py-1 rounded-md shadow-lg flex items-center space-x-1">
          <IconComponent className="h-3 w-3" />
          <span className="capitalize">
            {item.category === "business"
              ? item.business_category
              : item.category}
          </span>
        </div>

        {/* <div className="absolute top-4 right-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold px-3 py-1.5 rounded-2xl shadow-lg">
          Featured
        </div> */}

        <div className="absolute bottom-0 left-0 right-0 p-2">
          <div className="py-2 px-4">
            <h3 className="text-sm md:text-base mb-1 md:mb-2 line-clamp-2 text-white leading-tight ">
              {item.business_name ?? item.title}
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
