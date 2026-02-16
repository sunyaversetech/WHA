import type { FeaturedItem } from "../types";

export const featuredItems: FeaturedItem[] = [
  {
    id: "united-pay-remit",
    type: "business",
    title: "United Pay Remit",
    image: "/business/unitedpay.jpg",
    description:
      "Fast, secure, and compliant money transfers from Australia to Nepal.",
    location: "Sydney",
    city: "Sydney",
  },
  {
    id: "lakeside-gurkhas",
    type: "business",
    title: "Lake Side Gurkhas",
    image: "/business/lake-side.jpg",
    description:
      "Authentic Nepalese cuisine with a cozy ambiance near the lake.",
    city: "Canberra",
    location: "Kingston, Canberra",
  },
  {
    id: "wow-fresh-canberra",
    type: "business",
    title: "WOW Fresh",
    image: "/business/wow-banner.png", // Desktop image
    imageMobile: "/business/wow-banner-mb.png", // Mobile image
    description: "Fresh fruit & veggie boxes delivered weekly across Canberra.",
    city: "Canberra",
    location: "Canberra",
  },

  //   {
  //     id: "3",
  //     type: "deal",
  //     title: "50% Off on Momos",
  //     image: "/placeholder.jpg",
  //     description: "Enjoy half price on all momo orders this weekend!",
  //   },

  {
    id: "5",
    type: "event",
    title: "What's Happening Australia",
    image: "/wha/wha-banner.png",
    imageMobile: "/wha/wha-banner-mb.png", // Mobile image
    description: "",
    city: "Sydney",
    location: "Sydney, Australia",
  },
];
