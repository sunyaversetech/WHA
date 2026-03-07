"use client";

import React, { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SponsorSliderProps {
  children: React.ReactNode;
  className?: string;
}

export default function SponsorSlider({
  children,
  className = "",
}: SponsorSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const totalSlides = React.Children.count(children);

  const scrollToIndex = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const width = container.clientWidth;

    container.scrollTo({
      left: width * index,
      behavior: "smooth",
    });

    setCurrentIndex(index);
  };

  const scrollNext = () => {
    scrollToIndex((currentIndex + 1) % totalSlides);
  };

  const scrollPrev = () => {
    scrollToIndex((currentIndex - 1 + totalSlides) % totalSlides);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const width = container.clientWidth;
      const index = Math.round(container.scrollLeft / width);
      setCurrentIndex(index);
    };

    container.addEventListener("scroll", handleScroll);

    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Slider */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-4  scrollbar-hide"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {React.Children.map(children, (child, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-full"
            style={{ scrollSnapAlign: "center" }}
          >
            {child}
          </div>
        ))}
      </div>

      {/* Arrows */}
      {totalSlides > 1 && (
        <div className="absolute hidden bottom-8 right-4 md:flex gap-2 z-10">
          <button
            onClick={scrollPrev}
            className="bg-white/70 backdrop-blur-sm p-2 rounded-full shadow hover:bg-white transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={scrollNext}
            className="bg-white/70 backdrop-blur-sm p-2 rounded-full shadow hover:bg-white transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Dots */}
      {totalSlides > 1 && (
        <div className="flex justify-center mt-3 gap-2">
          {Array.from({ length: totalSlides }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`h-2 rounded-full transition-all ${
                index === currentIndex ? "w-6 bg-primary" : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
