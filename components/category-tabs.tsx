"use client";

import type React from "react";

import { useState } from "react";
import {
  Globe,
  BookOpen,
  Music,
  Users,
  Tent,
  Utensils,
  Briefcase,
  Coffee,
  ShoppingBag,
  Truck,
  Scissors,
  Building,
  Ticket,
} from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: React.ElementType;
}

interface CategoryTabsProps {
  type: "events" | "deals" | "businesses";
  onCategoryChange: (category: string) => void;
}

export default function CategoryTabs({
  type,
  onCategoryChange,
}: CategoryTabsProps) {
  const [activeCategory, setActiveCategory] = useState("all");

  const getCategories = (): Category[] => {
    switch (type) {
      case "events":
        return [
          { id: "all", name: "All", icon: Globe },
          { id: "concert", name: "Concert", icon: Music },
          { id: "education", name: "Education", icon: BookOpen },
          { id: "community", name: "Community", icon: Users },
          { id: "festival", name: "Festivals", icon: Tent },
          { id: "food", name: "Food", icon: Utensils },
        ];
      case "deals":
        return [
          { id: "all", name: "All", icon: Globe },
          { id: "food", name: "Food", icon: Utensils },
          { id: "retail", name: "Retail", icon: ShoppingBag },
          { id: "services", name: "Services", icon: Briefcase },
          { id: "entertainment", name: "Entertainment", icon: Music },
        ];
      case "businesses":
        return [
          { id: "all", name: "All", icon: Globe },
          { id: "restaurant", name: "Restaurants", icon: Utensils },
          { id: "cafe", name: "Cafés", icon: Coffee },
          { id: "food-truck", name: "Food Trucks", icon: Truck },
          { id: "grocery", name: "Grocery", icon: ShoppingBag },
          { id: "salon", name: "Salons", icon: Scissors },
          { id: "consultancy", name: "Consultancies", icon: Briefcase },
          { id: "event", name: "Event", icon: Ticket },
          { id: "other", name: "Others", icon: Building },
        ];
      default:
        return [{ id: "all", name: "All", icon: Globe }];
    }
  };

  const categories = getCategories();

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    onCategoryChange(categoryId);
  };

  // Get color based on type
  const getActiveColor = () => {
    switch (type) {
      case "events":
        return "bg-primary text-white ";
      case "deals":
        return "bg-green-500 text-white ";
      case "businesses":
        return "bg-purple-500 text-white ";
      default:
        return "bg-blue-500 text-white ";
    }
  };

  return (
    <div
      className="flex overflow-x-auto scrollbar-hide gap-1 md:gap-4"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
      }}>
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = activeCategory === category.id;

        return (
          <button
            key={category.id}
            onClick={() => handleCategoryChange(category.id)}
            className={`flex flex-col items-center justify-center transition-colors duration-200 flex-shrink-0 group p-1.5 rounded-md min-w-[60px] md:px-3 md:py-3 md:rounded-2xl md:min-w-[90px] lg:min-w-[100px] ${
              isActive
                ? getActiveColor()
                : "bg-gray-100/50 border border-gray-200 text-gray-600 hover:text-gray-800 hover:bg-white/90"
            }`}>
            <div className={`rounded-lg mb-1 md:mb-2`}>
              <Icon
                className={`transition-colors duration-200 h-4 w-4 md:h-5 md:w-5  ${
                  isActive
                    ? "text-white"
                    : "text-gray-500 group-hover:text-gray-700"
                }`}
              />
            </div>
            <span
              className={`font-medium transition-colors duration-200 text-[10px] md:text-sm  ${
                isActive
                  ? "text-white"
                  : "text-gray-600 group-hover:text-gray-800"
              }`}>
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
