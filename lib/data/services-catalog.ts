import {
  Scissors,
  Sparkles,
  GraduationCap,
  Dumbbell,
  Camera,
  UtensilsCrossed,
  Home,
  Car,
  Briefcase,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface ServiceItem {
  name: string;
  slug: string;
  emoji: string;
}

export interface ServiceCategory {
  name: string;
  slug: string;
  icon: LucideIcon;
  color: string;          // Tailwind bg class
  textColor: string;      // Tailwind text class
  services: ServiceItem[];
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    name: "Beauty & Wellness",
    slug: "beauty",
    icon: Scissors,
    color: "bg-pink-50",
    textColor: "text-pink-600",
    services: [
      { name: "Haircut", slug: "haircut", emoji: "✂️" },
      { name: "Beard Trim", slug: "beard-trim", emoji: "🪒" },
      { name: "Facial", slug: "facial", emoji: "✨" },
      { name: "Massage", slug: "massage", emoji: "💆" },
      { name: "Nails", slug: "nails", emoji: "💅" },
      { name: "Makeup", slug: "makeup", emoji: "💄" },
    ],
  },
  {
    name: "Education & Visa",
    slug: "education",
    icon: GraduationCap,
    color: "bg-blue-50",
    textColor: "text-blue-600",
    services: [
      { name: "Student Visa", slug: "student-visa", emoji: "🎓" },
      { name: "Migration Advice", slug: "migration-advice", emoji: "🛂" },
      { name: "Course Consultation", slug: "course-consultation", emoji: "📚" },
      { name: "Skills Assessment", slug: "skills-assessment", emoji: "📋" },
      { name: "PR Consultation", slug: "pr-consultation", emoji: "🏠" },
    ],
  },
  {
    name: "Fitness",
    slug: "fitness",
    icon: Dumbbell,
    color: "bg-orange-50",
    textColor: "text-orange-600",
    services: [
      { name: "Personal Training", slug: "personal-training", emoji: "🏋️" },
      { name: "Yoga", slug: "yoga", emoji: "🧘" },
      { name: "Group Fitness", slug: "group-fitness", emoji: "🤸" },
      { name: "Pilates", slug: "pilates", emoji: "🎽" },
      { name: "Martial Arts", slug: "martial-arts", emoji: "🥋" },
    ],
  },
  {
    name: "Photography",
    slug: "photography",
    icon: Camera,
    color: "bg-purple-50",
    textColor: "text-purple-600",
    services: [
      { name: "Wedding Photography", slug: "wedding-photography", emoji: "💍" },
      { name: "Event Photography", slug: "event-photography", emoji: "📸" },
      { name: "Portrait Photography", slug: "portrait", emoji: "🖼️" },
      { name: "Product Photography", slug: "product-photography", emoji: "📦" },
    ],
  },
  {
    name: "Food & Catering",
    slug: "food",
    icon: UtensilsCrossed,
    color: "bg-amber-50",
    textColor: "text-amber-600",
    services: [
      { name: "Momo Catering", slug: "momo-catering", emoji: "🥟" },
      { name: "Event Catering", slug: "event-catering", emoji: "🍱" },
      { name: "Corporate Catering", slug: "corporate-catering", emoji: "🏢" },
      { name: "Private Chef", slug: "private-chef", emoji: "👨‍🍳" },
    ],
  },
  {
    name: "Home Services",
    slug: "home",
    icon: Home,
    color: "bg-teal-50",
    textColor: "text-teal-600",
    services: [
      { name: "Cleaning", slug: "cleaning", emoji: "🧹" },
      { name: "Plumbing", slug: "plumbing", emoji: "🔧" },
      { name: "Electrical", slug: "electrical", emoji: "⚡" },
      { name: "Painting", slug: "painting", emoji: "🎨" },
      { name: "Removalists", slug: "removalists", emoji: "📦" },
    ],
  },
  {
    name: "Automotive",
    slug: "automotive",
    icon: Car,
    color: "bg-slate-50",
    textColor: "text-slate-600",
    services: [
      { name: "Driving Lessons", slug: "driving-lessons", emoji: "🚗" },
      { name: "Car Service", slug: "car-service", emoji: "🔩" },
      { name: "Car Detailing", slug: "car-detailing", emoji: "✨" },
      { name: "Roadside Assist", slug: "roadside-assist", emoji: "🛞" },
    ],
  },
  {
    name: "Business Services",
    slug: "business",
    icon: Briefcase,
    color: "bg-indigo-50",
    textColor: "text-indigo-600",
    services: [
      { name: "Tax Return", slug: "tax-return", emoji: "🧾" },
      { name: "Accounting", slug: "accounting", emoji: "📊" },
      { name: "Legal Advice", slug: "legal-advice", emoji: "⚖️" },
      { name: "IT Support", slug: "it-support", emoji: "💻" },
    ],
  },
  {
    name: "Community",
    slug: "community",
    icon: Users,
    color: "bg-rose-50",
    textColor: "text-rose-600",
    services: [
      { name: "Pujari Services", slug: "pujari", emoji: "🪔" },
      { name: "Cultural Programs", slug: "cultural-programs", emoji: "🎭" },
      { name: "Language Classes", slug: "language-classes", emoji: "🗣️" },
      { name: "Community Events", slug: "community-events", emoji: "🎉" },
    ],
  },
  {
    name: "Beauty & Spa",
    slug: "spa",
    icon: Sparkles,
    color: "bg-fuchsia-50",
    textColor: "text-fuchsia-600",
    services: [
      { name: "Spa Treatment", slug: "spa-treatment", emoji: "🛁" },
      { name: "Waxing", slug: "waxing", emoji: "🌸" },
      { name: "Eyebrow Threading", slug: "threading", emoji: "👁️" },
      { name: "Hair Colour", slug: "hair-colour", emoji: "🌈" },
    ],
  },
];

export const POPULAR_SERVICES: ServiceItem[] = [
  { name: "Haircut", slug: "haircut", emoji: "✂️" },
  { name: "Massage", slug: "massage", emoji: "💆" },
  { name: "Momo Catering", slug: "momo-catering", emoji: "🥟" },
  { name: "Student Visa", slug: "student-visa", emoji: "🎓" },
  { name: "Driving Lessons", slug: "driving-lessons", emoji: "🚗" },
  { name: "Facial", slug: "facial", emoji: "✨" },
  { name: "Photography", slug: "event-photography", emoji: "📸" },
  { name: "Tax Return", slug: "tax-return", emoji: "🧾" },
];

export const WHEN_OPTIONS = [
  { label: "Any time", value: "any" },
  { label: "Today", value: "today" },
  { label: "Tomorrow", value: "tomorrow" },
  { label: "This weekend", value: "weekend" },
  { label: "Custom date", value: "custom" },
];

export const AU_CITIES = [
  { city: "Sydney", emoji: "🌉" },
  { city: "Melbourne", emoji: "🏙️" },
  { city: "Brisbane", emoji: "🌴" },
  { city: "Perth", emoji: "🌅" },
  { city: "Canberra", emoji: "🏛️" },
  { city: "Adelaide", emoji: "🍷" },
  { city: "Hobart", emoji: "⛰️" },
  { city: "Darwin", emoji: "🌿" },
];

export const ALL_SERVICES: ServiceItem[] = SERVICE_CATEGORIES.flatMap(
  (c) => c.services,
);

export function searchServices(query: string): ServiceItem[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return ALL_SERVICES.filter((s) => s.name.toLowerCase().includes(q)).slice(
    0,
    8,
  );
}
