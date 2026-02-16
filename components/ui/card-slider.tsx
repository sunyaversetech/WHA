"use client";

import React, { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CardSliderProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  viewAllHref?: string;
  className?: string;
}

export default function CardSlider({
  children,
  title,
  icon,
  viewAllHref,
  className = "",
}: CardSliderProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);

  // Calculate total slides and update arrows -- old
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateArrows = () => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    };

    // Calculate total slides based on container width and card width
    const cardWidth = container.clientWidth * 0.85; // 85% of container width
    const gap = 16; // gap-4 = 16px
    const totalWidth = container.scrollWidth;
    const visibleWidth = container.clientWidth;
    const calculatedSlides =
      Math.ceil((totalWidth - visibleWidth) / (cardWidth + gap)) + 1;
    setTotalSlides(calculatedSlides);

    updateArrows();
    container.addEventListener("scroll", updateArrows);
    window.addEventListener("resize", updateArrows);

    return () => {
      container.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [children]);

  const scrollToNext = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = container.clientWidth * 0.85;
    const gap = 16;
    const scrollAmount = cardWidth + gap;

    container.scrollBy({
      left: scrollAmount,
      behavior: "smooth",
    });
  };

  const scrollToPrev = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = container.clientWidth * 0.85;
    const gap = 16;
    const scrollAmount = cardWidth + gap;

    container.scrollBy({
      left: -scrollAmount,
      behavior: "smooth",
    });
  };

  const scrollToIndex = (index: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = container.clientWidth * 0.85;
    const gap = 16;
    const scrollAmount = index * (cardWidth + gap);

    container.scrollTo({
      left: scrollAmount,
      behavior: "smooth",
    });
  };

  // Update current index based on scroll position
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const cardWidth = container.clientWidth * 0.85;
      const gap = 16;
      const currentScroll = container.scrollLeft;
      const index = Math.round(currentScroll / (cardWidth + gap));
      setCurrentIndex(Math.max(0, Math.min(index, totalSlides - 1)));
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [totalSlides]);

  return (
    <div className={` ${className}`}>
      {/* Header */}
      {(title || viewAllHref) && (
        <div className="flex items-center justify-between mb-1 md:mb-2">
          {title && (
            <div className="flex items-center space-x-2 md:space-x-3">
              {icon && <div>{icon}</div>}
              <h2 className="text-secondary text-sm md:text-md lg:text-xl font-bold">
                {title}
              </h2>
            </div>
          )}
          {viewAllHref && (
            <Button
              asChild
              variant="link"
              className="flex items-center group text-sm md:text-md">
              <a href={viewAllHref}>
                View all{" "}
                <ChevronRight className="ml-1 h-3 w-3 md:h-4 md:w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      {React.Children.count(children) === 0 ? (
        <div className="text-center py-8">
          <div className="text-neutral text-sm md:text-base">
            No items to display
          </div>
        </div>
      ) : (
        <>
          {/* Slider Container */}
          <div className="relative">
            {/* Scroll Container */}
            <div
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                scrollSnapType: "x mandatory",
              }}>
              {/* Cards with 85% width and 30% peek */}
              <div className="flex gap-4 min-w-full">
                {React.Children.map(children, (child, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 w-[85%] sm:w-[60%] lg:w-[40%]"
                    style={{
                      scrollSnapAlign: "start",
                    }}>
                    {child}
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows - Desktop Only */}
            <div className="hidden md:block">
              {showLeftArrow && (
                <button
                  onClick={scrollToPrev}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 text-gray-700 hover:bg-white transition-colors shadow-lg z-10"
                  aria-label="Previous">
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              {showRightArrow && (
                <button
                  onClick={scrollToNext}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-full p-2 text-gray-700 hover:bg-white transition-colors shadow-lg z-10"
                  aria-label="Next">
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Scroll Indicators - Dots */}
            {totalSlides > 1 && (
              <div className="flex justify-center mt-2 space-x-2">
                {Array.from({ length: totalSlides }, (_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === currentIndex
                        ? "bg-primary w-6"
                        : "bg-gray-400 hover:bg-secondary"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
