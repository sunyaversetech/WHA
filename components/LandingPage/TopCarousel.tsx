"use client";

import * as React from "react";
import Image from "next/image";
import { Star, MapPin } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";

const FEATURED_BUSINESSES = [
  {
    id: 1,
    name: "The Grand Hotel",
    category: "Hospitality",
    rating: 4.8,
    reviews: 124,
    location: "Sydney, NSW",
    image: "/hotel.jpg",
  },
];

export default function TopCarouselSection() {
  return (
    <section className="py-12 bg-gray-50">
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              Featured Businesses
            </h2>
            <p className="text-muted-foreground">
              Hand-picked top rated businesses near you
            </p>
          </div>
          <div className="hidden md:flex gap-2"></div>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full">
          <CarouselContent className="-ml-4">
            {FEATURED_BUSINESSES.map((business) => (
              <CarouselItem
                key={business.id}
                className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <BusinessCard business={business} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex justify-end gap-2 mt-4 md:absolute md:-top-16 md:right-0">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        </Carousel>
      </div>
    </section>
  );
}

function BusinessCard({ business }: { business: any }) {
  return (
    <Card className="overflow-hidden border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <div className="relative aspect-[4/3]">
        <Image
          src={business.image}
          alt={business.name}
          fill
          className="object-cover"
        />
        <Badge className="absolute top-3 left-3 bg-white/90 text-black hover:bg-white">
          {business.category}
        </Badge>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-lg truncate">{business.name}</h3>
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{business.rating}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground text-sm">
          <MapPin className="w-4 h-4" />
          <span>{business.location}</span>
        </div>
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0 text-xs text-muted-foreground">
        {business.reviews} reviews
      </CardFooter>
    </Card>
  );
}
