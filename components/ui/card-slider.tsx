"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface CardSliderProps {
  children: React.ReactNode;
  title?: string;
  icon?: React.ReactNode;
  viewAllHref?: string;
  className?: string;
}

const CARD_RATIO = 0.82;
const GAP = 16;

export default function CardSlider({
  children,
  title,
  icon,
  viewAllHref,
  className = "",
}: CardSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);

  const childCount = React.Children.count(children);

  // Stable callback — reads everything from the DOM, no stale state deps
  const updateScrollState = useCallback(() => {
    const c = scrollRef.current;
    if (!c) return;
    const { scrollLeft, scrollWidth, clientWidth } = c;
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 2);
    const cardW = clientWidth * CARD_RATIO;
    const total = Math.max(
      1,
      Math.ceil((scrollWidth - clientWidth) / (cardW + GAP)) + 1,
    );
    const idx = Math.round(scrollLeft / (cardW + GAP));
    setTotalSlides(total);
    setCurrentIndex(Math.max(0, Math.min(idx, total - 1)));
  }, []);

  useEffect(() => {
    const c = scrollRef.current;
    if (!c) return;
    updateScrollState();
    c.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      c.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, childCount]);

  const scrollBy = (dir: 1 | -1) => {
    const c = scrollRef.current;
    if (!c) return;
    c.scrollBy({ left: dir * (c.clientWidth * CARD_RATIO + GAP), behavior: "smooth" });
  };

  const scrollToIndex = (idx: number) => {
    const c = scrollRef.current;
    if (!c) return;
    c.scrollTo({ left: idx * (c.clientWidth * CARD_RATIO + GAP), behavior: "smooth" });
  };

  return (
    <div className={className}>
      {/* Header */}
      {(title || viewAllHref) && (
        <div className="flex items-center justify-between mb-3">
          {title && (
            <div className="flex items-center gap-2">
              {icon}
              <h2 className="text-sm md:text-base lg:text-lg font-bold text-primary">
                {title}
              </h2>
            </div>
          )}
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="flex items-center gap-1 text-xs md:text-sm font-semibold text-secondary
                         hover:text-secondary/80 transition-colors focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-secondary rounded">
              View all
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      )}

      {childCount === 0 ? (
        <p className="py-6 text-sm text-center text-muted-foreground">
          No items to display
        </p>
      ) : (
        <div className="relative">
          {/* Scroll container */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide"
            style={{
              scrollSnapType: "x mandatory",
              scrollbarWidth: "none",
              WebkitOverflowScrolling: "touch",
            }}>
            {React.Children.map(children, (child, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[82%] sm:w-[58%]"
                style={{ scrollSnapAlign: "start" }}>
                {child}
              </div>
            ))}
          </div>

          {/* Prev arrow */}
          {canScrollLeft && (
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Previous"
              className="absolute left-1 top-1/2 -translate-y-1/2 z-10
                         flex h-9 w-9 items-center justify-center
                         bg-white border border-border rounded-full shadow-md
                         text-primary hover:bg-muted transition-colors
                         focus-visible:ring-2 focus-visible:ring-primary">
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Next arrow */}
          {canScrollRight && (
            <button
              onClick={() => scrollBy(1)}
              aria-label="Next"
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10
                         flex h-9 w-9 items-center justify-center
                         bg-white border border-border rounded-full shadow-md
                         text-primary hover:bg-muted transition-colors
                         focus-visible:ring-2 focus-visible:ring-primary">
              <ChevronRight className="h-4 w-4" />
            </button>
          )}

          {/* Dot indicators */}
          {totalSlides > 1 && (
            <div
              className="flex justify-center items-center gap-1.5 mt-3"
              role="tablist"
              aria-label="Slides">
              {Array.from({ length: totalSlides }, (_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === currentIndex}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => scrollToIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-200 ${
                    i === currentIndex
                      ? "w-5 bg-secondary"
                      : "w-1.5 bg-border hover:bg-muted-foreground"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
