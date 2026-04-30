"use client";

import type React from "react";

import { Heart } from "lucide-react";
import { useFavorites } from "@/contexts/favorites-context";

interface FavoriteButtonProps {
  type: "events" | "deals";
  id: string;
  size?: "sm" | "md" | "lg";
}

export default function FavoriteButton({ type, id }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFavorited = isFavorite(type, id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(type, id);
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full transition-all duration-200 ${
        isFavorited ? "bg-primary/10" : "hover:bg-neutral/50"
      }`}
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}>
      <Heart
        className={`h-5 w-5 transition-colors duration-200 ${
          isFavorited
            ? "text-primary fill-primary"
            : "text-neutral group-hover:text-primary"
        }`}
      />
    </button>
  );
}
