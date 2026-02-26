"use client";

import Link from "next/link";
import {
  Calendar,
  Sparkles,
  Building,
  Tag,
  Users,
  Star,
  CalendarRange,
} from "lucide-react";
import EventCard from "@/components/cards/event-card";
import DealCard from "@/components/cards/deal-card";
import BusinessCard from "@/components/cards/business-card";
import PlaceholderCard from "@/components/cards/placeholder-card";
import { getEvents } from "@/lib/data/events";
import { getDeals } from "@/lib/data/deals";
import { getBusinesses } from "@/lib/data/businesses";
import CardSlider from "@/components/ui/card-slider";
import FeaturedCard from "@/components/cards/featured-card";
import { featuredItems } from "@/lib/data/featured";
import {
  useFilteredEvents,
  useFilteredDeals,
  useFilteredBusinesses,
} from "@/hooks/use-filtered-data";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { useGetLandingPageData } from "@/services/landing.service";

export default function LandingPage() {
  const allEvents = getEvents();
  const allDeals = getDeals();
  const allBusinesses = getBusinesses();

  const { data } = useGetLandingPageData();

  console.log("data", data);
  const events = useFilteredEvents(allEvents);
  const deals = useFilteredDeals(allDeals);
  const businesses = useFilteredBusinesses(allBusinesses);

  return (
    <div className=" bg-gradient-modern  text-black">
      <div className="container-modern !pr-0  pt-1 md:pt-6">
        <Carousel className="w-full ">
          <CarouselContent>
            {data?.data.business.map((item: any) => (
              <CarouselItem key={item._id} className="basis-1/2 lg:basis-1/2">
                <FeaturedCard key={item._id} item={item} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>

      {/* What We Offer Section */}
      {/* <div className="container-modern mb-8 ">
        <div className="card-lg p-4 md:p-6 lg:p-8">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="gradient-text text-lg md:text-xl lg:text-2xl font-bold mb-3 md:mb-4">
              Everything You Need in One Place
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
              From cultural events to local business deals, we bring the Nepali
              community together
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 md:gap-6">
            <Link href="/events" className="group">
              <div className="card p-4 md:p-6 text-center hover-lift transition-all duration-300">
                <div className="p-2 md:p-3 bg-gradient-to-r from-primary to-secondary rounded-2xl w-fit mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Calendar className="h-4 w-4 md:h-8 md:w-8 text-base" />
                </div>
                <h3 className="text-sm md:text-lg font-semibold text-secondary mb-2">
                  Events & Culture
                </h3>
                <p className="text-neutral text-xs md:text-sm mb-3 md:mb-4 hidden md:block">
                  Discover cultural events, festivals, and community gatherings
                </p>
                <div className="flex items-center justify-center space-x-1 text-primary group-hover:text-primary/80 transition-colors">
                  <span className="text-xs md:text-sm font-medium">
                    Explore
                  </span>
                  <ArrowRight className="h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <Link href="/deals" className="group">
              <div className="card p-4 md:p-6 text-center hover-lift transition-all duration-300">
                <div className="p-2 md:p-3 bg-gradient-to-r from-secondary to-neutral rounded-2xl w-fit mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Tag className="h-4 w-4 md:h-8 md:w-8 text-base" />
                </div>
                <h3 className="text-sm md:text-lg font-semibold text-secondary mb-2">
                  Exclusive Deals
                </h3>
                <p className="text-neutral text-xs md:text-sm mb-3 md:mb-4 hidden md:block">
                  Get special offers and discounts from local Nepali businesses
                </p>
                <div className="flex items-center justify-center space-x-1 text-secondary group-hover:text-secondary/80 transition-colors">
                  <span className="text-xs md:text-sm font-medium">
                    Explore
                  </span>
                  <ArrowRight className="h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>

            <Link href="/businesses" className="group">
              <div className="card p-4 md:p-6 text-center hover-lift transition-all duration-300">
                <div className="p-2 md:p-3 bg-gradient-to-r from-neutral to-secondary rounded-2xl w-fit mx-auto mb-3 md:mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Building className="h-4 w-4 md:h-8 md:w-8 text-base" />
                </div>
                <h3 className="text-sm md:text-lg font-semibold text-secondary mb-2">
                  Local Businesses
                </h3>
                <p className="text-neutral text-xs md:text-sm mb-3 md:mb-4 hidden md:block">
                  Find and support Nepali-owned businesses in your area
                </p>
                <div className="flex items-center justify-center space-x-1 text-neutral group-hover:text-neutral/80 transition-colors">
                  <span className="text-xs md:text-sm font-medium">
                    Explore
                  </span>
                  <ArrowRight className="h-3 w-3 md:h-4 md:w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div> */}

      <div className=" mt-2 md:mt-4 bg-base text-black rounded-t-3xl">
        {/* Flexible Stats Cards*/}
        <div className="container-modern py-4 md:py-6 border-b border-divider ">
          <h2 className=" text-black text-sm md:text-md lg:text-lg font-bold mb-2 md:mb-4">
            Explore what`s active right now in your city
          </h2>

          <div className="flex flex-wrap justify-between gap-2 mx-auto  md:max-w-full rounded-lg ">
            {[
              {
                count: events.length,
                label: "Events",
                color: "bg-primary/10 text-primary",
                hover: "hover:bg-primary/20",
                href: "/events",
                icon: Calendar,
              },
              {
                count: deals.length,
                label: "Deals",
                color: "bg-secondary/10 text-secondary",
                hover: "hover:bg-secondary/20",
                href: "/deals",
                icon: Tag,
              },
              {
                count: businesses.length,
                label: "Businesses",
                color: "bg-neutral/10 text-neutral",
                hover: "hover:bg-neutral/20",
                href: "/businesses",
                icon: Building,
              },
            ].map((stat, index) => (
              <Link
                key={index}
                href={stat.href}
                className={`flex-1  p-2 md:p-4 rounded-lg shadow-sm text-black bg-white/40 border border-secondary/20 backdrop-blur-sm transition-all ${stat.color} ${stat.hover} hover:shadow-md flex items-center justify-center sm:flex-col sm:text-center`}>
                <div className="flex text-black flex-col items-center">
                  <div className="flex items-center justify-center mb-1">
                    <stat.icon className="h-5 w-5 mr-2 text-primary" />
                    <span className="text-lg font-bold sm:text-xl md:text-2xl text-black">
                      {stat.count}
                    </span>
                  </div>

                  <div className="text-xs font-medium uppercase tracking-wider text-center text-black">
                    {stat.label}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="container-modern pt-2 pb-4 md:py-6 pr-0 border-b border-divider">
          {/* <CardSlider
            title="Upcoming Events"
            icon={<Calendar className="h-5 w-5 text-primary" />}
            viewAllHref="/events">
            {events.length === 0 ? (
              <PlaceholderCard type="events" />
            ) : (
              events
                .slice(0, 6)
                .map((event: any) => <EventCard key={event.id} event={event} />)
            )}
          </CardSlider> */}
          <h1 className="mb-4 flex items-center gap-2">
            <CalendarRange /> Upcoming Events
          </h1>

          {data?.data.upcomingevents.length < 1 ? (
            <div className="w-full items-center text-center text-2xl font-semibold">
              No Upcoming Events Right Now
            </div>
          ) : (
            <Carousel className="w-full ">
              <CarouselContent>
                {data?.data.upcomingevents.map((item: any) => (
                  <CarouselItem
                    key={item._id}
                    className="basis-1/2 lg:basis-1/2">
                    <EventCard key={item._id} event={item} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}
        </div>

        <div className="container-modern pt-2 pb-4 md:py-6 pr-0 border-b border-divider">
          <CardSlider
            title="Active Deals"
            icon={<Tag className="h-5 w-5 text-primary" />}
            viewAllHref="/deals">
            {deals.length === 0 ? (
              <PlaceholderCard type="deals" />
            ) : (
              deals
                .slice(0, 6)
                .map((deal: any) => <DealCard key={deal.id} deal={deal} />)
            )}
          </CardSlider>
        </div>

        <div className="container-modern pt-2 pb-4 md:py-6 !pr-0 border-b border-divider">
          <CardSlider
            title="Local Businesses"
            icon={<Building className="h-5 w-5 text-primary" />}
            viewAllHref="/businesses">
            {businesses.length === 0 ? (
              <PlaceholderCard type="businesses" />
            ) : (
              businesses
                .slice(0, 6)
                .map((business: any) => (
                  <BusinessCard key={business.id} business={business} />
                ))
            )}
          </CardSlider>
        </div>

        <div className="container-modern pt-2 pb-4 md:py-6  border-b border-divider">
          <div className="card-lg !rounded-lg p-2 md:p-6 lg:p-8">
            <div className="text-center mb-2 md:mb-6">
              <div className="flex items-center justify-center space-x-3  md:mb-4">
                <div className="p-2 bg-primary rounded-lg">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-base" />
                </div>
                <h2 className="text-secondary  md:text-lg lg:text-xl font-semibold">
                  Connect with Us
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              <a
                href="mailto:info@whatshappeningaustralia.com"
                className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors p-2 md:p-3 rounded-lg hover:bg-primary/10"
                aria-label="Email">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 2v.01L12 13 20 6.01V6H4zm0 12h16V8l-8 7-8-7v10z" />
                </svg>
                <span className="font-medium text-sm md:text-base hidden md:block">
                  Email
                </span>
              </a>
              <a
                href="https://www.instagram.com/whatshappening_australia"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors p-2 md:p-3 rounded-lg hover:bg-primary/10"
                aria-label="Instagram">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true">
                  <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5A4.25 4.25 0 007.75 20.5h8.5a4.25 4.25 0 004.25-4.25v-8.5A4.25 4.25 0 0016.25 3.5h-8.5zm8.88 2.3a1.125 1.125 0 110 2.25 1.125 1.125 0 010-2.25zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z" />
                </svg>
                <span className="font-medium text-sm md:text-base hidden md:block">
                  Instagram
                </span>
              </a>
              <a
                href="https://www.facebook.com/whatshappeningaustralia"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-primary hover:text-primary/80 transition-colors p-2 md:p-3 rounded-lg hover:bg-primary/10"
                aria-label="Facebook">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true">
                  <path d="M22 12a10 10 0 10-11.5 9.87v-6.99H8v-2.88h2.5v-2.2c0-2.48 1.49-3.85 3.77-3.85 1.09 0 2.23.2 2.23.2v2.45h-1.25c-1.23 0-1.61.77-1.61 1.56v1.85h2.74l-.44 2.88h-2.3v6.99A10 10 0 0022 12z" />
                </svg>
                <span className="font-medium text-sm md:text-base hidden md:block">
                  Facebook
                </span>
              </a>
              <a
                href="https://www.tiktok.com/@whatshappeningaus"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-secondary hover:text-secondary/80 transition-colors p-2 md:p-3 rounded-lg hover:bg-secondary/10"
                aria-label="TikTok">
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 fill-current"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg">
                  <path d="M41.5 14.7c-2.6 0-5-1-6.9-2.7v16.6c0 7.6-6.1 13.9-13.7 13.9-3.7 0-7.1-1.5-9.6-4-2.6-2.6-4-6-4-9.6s1.5-7.1 4-9.6c2.6-2.6 6-4 9.6-4 .8 0 1.6.1 2.3.2v6.7c-.7-.2-1.5-.3-2.3-.3-4.3 0-7.8 3.6-7.8 8s3.5 8 7.8 8c4.3 0 7.8-3.6 7.8-8V4h6.2c.2 2.6 1.4 5 3.3 6.7 1.8 1.7 4.2 2.7 6.7 2.8v6.2z" />
                </svg>
                <span className="font-medium text-sm md:text-base hidden md:block">
                  TikTok
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Notice: Platform in Development */}
      <div className="container-modern py-4 md:py-6">
        <div className="card p-3 md:p-4 lg:p-6">
          <div className="flex items-start space-x-3 md:space-x-4">
            <div className="p-2 bg-yellow-500/20 rounded-xl flex-shrink-0">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-yellow-600" />
            </div>
            <div>
              <h3 className="font-semibold text-yellow-800 mb-1 md:mb-2 text-sm">
                Platform in Development
              </h3>
              <p className="text-yellow-700 text-xs md:text-sm">
                Information may be outdated. Please check official business
                sites for up-to-date details.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
