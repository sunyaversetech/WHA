import {
  Car,
  BrushCleaning,
  Cable,
  Coffee,
  BookOpenCheck,
  PlaneTakeoff,
  Gem,
  Paintbrush,
  Store,
  ScanHeart,
  Hammer,
  Calendar,
  Move,
  ScissorsLineDashed,
  CarTaxiFront,
  Van,
  ChefHat,
  ChartBarStacked,
  User,
  type LucideIcon,
} from "lucide-react";

export interface BusinessCategory {
  label: string;
  value: string;
  icon: LucideIcon;
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  { label: "Automotive",        value: "automotive",      icon: Car },
  { label: "Cleaning",          value: "cleaning",         icon: BrushCleaning },
  { label: "Electrician",       value: "electrician",      icon: Cable },
  { label: "Restaurant",        value: "restaurant",       icon: Coffee },
  { label: "Consultancy",       value: "consultancy",      icon: BookOpenCheck },
  { label: "Travel",            value: "travel and tours", icon: PlaneTakeoff },
  { label: "Wedding",           value: "wedding",          icon: Gem },
  { label: "Painter",           value: "painter",          icon: Paintbrush },
  { label: "Grocery",           value: "grocery",          icon: Store },
  { label: "Event Organizer",   value: "event-organizer",  icon: Calendar },
  { label: "Removalists",       value: "removalists",      icon: Move },
  { label: "Saloon / Barber",   value: "barber",           icon: ScissorsLineDashed },
  { label: "Plumber",           value: "plumber",          icon: Hammer },
  { label: "Driving School",    value: "driving school",   icon: CarTaxiFront },
  { label: "Food Truck",        value: "food truck",       icon: Van },
  { label: "Catering",          value: "catering",         icon: ChefHat },
  { label: "Health & Wellness", value: "health",           icon: ScanHeart },
  { label: "Retail Shop",       value: "retails",          icon: Store },
  { label: "Social Club",       value: "social club",      icon: User },
  { label: "Others",            value: "others",           icon: ChartBarStacked },
];
