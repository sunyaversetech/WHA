"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  images: string[];
  type: "events" | "deals" | "businesses";
  eventIds?: string[];
  eventTitles?: string[];
  eventDescriptions?: string[];
}

export default function HeroBanner({
  title,
  subtitle,
  buttonText,
  buttonLink,
  images,
  type,
  eventIds,
  eventTitles,
  eventDescriptions,
}: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Set background color based on type
  const getBgColor = () => {
    switch (type) {
      case "events":
        return "from-blue-700/70 to-blue-900/70";
      case "deals":
        return "from-green-700/70 to-green-900/70";
      case "businesses":
        return "from-purple-700/70 to-purple-900/70";
      default:
        return "from-blue-700/70 to-blue-900/70";
    }
  };

  // Helper to get the correct link for each type
  const getDetailLink = () => {
    if (!eventIds || !eventIds[currentSlide]) return "#";
    switch (type) {
      case "events":
        return `/events/${eventIds[currentSlide]}`;
      case "deals":
        return `/deals/${eventIds[currentSlide]}`;
      case "businesses":
        return `/businesses/${eventIds[currentSlide]}`;
      default:
        return "#";
    }
  };

  return (
    <div className="relative w-full h-[300px] md:h-[500px] overflow-hidden rounded-lg">
      {/* Background Image */}
      <div className="absolute inset-0 transition-opacity duration-500">
        <img
          src={images[currentSlide] || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>
      {/* Title and Description for all types */}
      {eventTitles &&
        eventDescriptions &&
        eventTitles[currentSlide] &&
        eventDescriptions[currentSlide] && (
          <div className="absolute bottom-20 left-6 z-30 max-w-lg">
            <h2 className="text-white text-md md:text-2xl font-bold mb-1">
              {eventTitles[currentSlide]}
            </h2>
            {/* <p className="text-white text-xs md:text-base font-normal line-clamp-2">{eventDescriptions[currentSlide]}</p> */}
          </div>
        )}
      {/* View Details Button for all types */}
      {eventIds && eventIds[currentSlide] && (
        <Link
          href={getDetailLink()}
          className="absolute bottom-6 left-6  backdrop-blur-md bg-white/20 text-white px-5 py-2 rounded-md font-medium shadow-lg transition-colors z-30 hover:bg-white/30 transition-all shadow-md hover:shadow-lg text-sm md:text-base">
          View Details
        </Link>
      )}
      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-1 md:p-2 text-white hover:bg-white/30 transition-colors z-20"
        aria-label="Previous slide">
        <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-1 md:p-2 text-white hover:bg-white/30 transition-colors z-20"
        aria-label="Next slide">
        <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
      </button>
      {/* Dots Indicator */}
      <div className="absolute bottom-4 md:bottom-6 left-0 right-0 flex justify-center space-x-2 z-20">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide
                ? "bg-white w-4"
                : "bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
