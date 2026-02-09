"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  MapPin,
  Mail,
  Instagram,
  Facebook,
  Music2, // Used for TikTok icon
  Store,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";

const BUSINESSES = [
  {
    id: 1,
    name: "Lake Side Gurkhas",
    location: "Kingston, Canberra",
    category: "Restaurant",
    image: "/images/gurkhas.jpg",
  },
  {
    id: 2,
    name: "Nakha Chhe",
    location: "Barton, Canberra",
    category: "Restaurant",
    image: "/images/nakha.jpg",
  },
  {
    id: 3,
    name: "The Junction Nepalese",
    location: "Wanniassa, Canberra",
    category: "Restaurant",
    image: "/images/junction.jpg",
  },
];

export default function LocalBusinessSection() {
  return (
    <div className="space-y-12 py-10 bg-white">
      {/* --- Local Businesses Section --- */}
      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-red-600" />
            <h2 className="text-xl font-bold text-slate-900">
              Local Businesses
            </h2>
          </div>
          <Link
            href="/businesses"
            className="text-sm font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <Carousel opts={{ align: "start" }} className="w-full">
          <CarouselContent className="-ml-4">
            {BUSINESSES.map((business) => (
              <CarouselItem
                key={business.id}
                className="pl-4 md:basis-1/2 lg:basis-1/3">
                <Card className="relative overflow-hidden border-none group cursor-pointer">
                  <div className="relative aspect-[16/9] w-full">
                    <Image
                      src={business.image}
                      alt={business.name}
                      fill
                      className="object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                    />
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent rounded-xl" />

                    {/* Category Badge */}
                    <Badge className="absolute top-3 left-3 bg-white text-red-600 hover:bg-white gap-1 px-2 py-0.5 text-[10px] font-bold uppercase">
                      <Store className="h-3 w-3" /> {business.category}
                    </Badge>

                    {/* Content */}
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="font-bold text-lg leading-tight">
                        {business.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-slate-200 mt-1">
                        <MapPin className="h-3 w-3" /> {business.location}
                      </div>
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          {/* Progress Dots Mockup (Manual styling) */}
          <div className="flex justify-center gap-1.5 mt-6">
            <div className="h-1.5 w-6 rounded-full bg-red-600" />
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
          </div>
        </Carousel>
      </section>

      {/* --- Connect With Us Section --- */}
      <section className="container mx-auto px-4">
        <div className="border rounded-2xl p-10 flex flex-col items-center justify-center space-y-8 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Mail className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              Connect with Us
            </h2>
          </div>

          <div className="flex items-center gap-10 md:gap-16">
            <Link
              href="mailto:info@whaustralia.com"
              className="text-red-600 hover:scale-110 transition-transform">
              <Mail className="h-6 w-6" />
            </Link>
            <Link
              href="#"
              className="text-red-600 hover:scale-110 transition-transform">
              <Instagram className="h-6 w-6" />
            </Link>
            <Link
              href="#"
              className="text-red-600 hover:scale-110 transition-transform">
              <Facebook className="h-6 w-6" />
            </Link>
            <Link
              href="#"
              className="text-red-600 hover:scale-110 transition-transform">
              <Music2 className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
