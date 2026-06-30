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
  Bike,
  Snowflake,
  Anchor,
  Waves,
  Package,
  type LucideIcon,
} from "lucide-react";

export interface BusinessCategory {
  label: string;
  value: string;
  icon: LucideIcon;
}

/** Service businesses where staff deliver the service */
export const EMPLOYEE_CATEGORIES: BusinessCategory[] = [
  { label: "Saloon / Barber",   value: "barber",           icon: ScissorsLineDashed },
  { label: "Event Organizer",   value: "event-organizer",  icon: Calendar },
  { label: "Travel & Tours",    value: "travel and tours", icon: PlaneTakeoff },
  { label: "Food Truck",        value: "food truck",       icon: Van },
  { label: "Catering",          value: "catering",         icon: ChefHat },
  { label: "Restaurant",        value: "restaurant",       icon: Coffee },
  { label: "Cleaning",          value: "cleaning",         icon: BrushCleaning },
  { label: "Electrician",       value: "electrician",      icon: Cable },
  { label: "Painter",           value: "painter",          icon: Paintbrush },
  { label: "Plumber",           value: "plumber",          icon: Hammer },
  { label: "Driving School",    value: "driving school",   icon: CarTaxiFront },
  { label: "Consultancy",       value: "consultancy",      icon: BookOpenCheck },
  { label: "Health & Wellness", value: "health",           icon: ScanHeart },
  { label: "Wedding",           value: "wedding",          icon: Gem },
  { label: "Social Club",       value: "social club",      icon: User },
  { label: "Automotive",        value: "automotive",       icon: Car },
  { label: "Removalists",       value: "removalists",      icon: Move },
  { label: "Retail Shop",       value: "retails",          icon: Store },
  { label: "Others",            value: "others",           icon: ChartBarStacked },
];

/** Rental / inventory businesses where customers borrow an item */
export const ITEM_CATEGORIES: BusinessCategory[] = [
  { label: "Kayak Rentals",      value: "kayak-rentals",      icon: Waves },
  { label: "Bike Rentals",       value: "bike-rentals",       icon: Bike },
  { label: "Car Rentals",        value: "car-rentals",        icon: Car },
  { label: "Ski Rentals",        value: "ski-rentals",        icon: Snowflake },
  { label: "Camper Van Rentals", value: "camper-van-rentals", icon: Van },
  { label: "Boat Rentals",       value: "boat-rentals",       icon: Anchor },
  { label: "Surfboard Rentals",  value: "surfboard-rentals",  icon: Waves },
  { label: "Scooter Rentals",    value: "scooter-rentals",    icon: Bike },
  { label: "Equipment Rentals",  value: "equipment-rentals",  icon: Package },
  { label: "Others",             value: "others",             icon: ChartBarStacked },
];

/** Combined list for the search bar (deduped by value) */
const _seen = new Set<string>();
export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  ...EMPLOYEE_CATEGORIES,
  ...ITEM_CATEGORIES,
].filter((c) => {
  if (_seen.has(c.value)) return false;
  _seen.add(c.value);
  return true;
});
