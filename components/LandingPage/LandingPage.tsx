"use client";
import Link from "next/link";
import { Calendar, Sparkles, Building, Tag, Users, Star } from "lucide-react";
import EventCard from "@/components/cards/event-card";
import BusinessCard from "@/components/cards/business-card";
import PlaceholderCard from "@/components/cards/placeholder-card";
import CardSlider from "@/components/ui/card-slider";
import FeaturedCard from "@/components/cards/featured-card";
import { useFilteredBusinesses } from "@/hooks/use-filtered-data";

import { useGetLandingPageData } from "@/services/landing.service";
import LandingPageSkeleton from "./LandingPageSkeleton";
import { useSearchParams } from "next/navigation";

export default function LandingPage() {
  const { data, isLoading } = useGetLandingPageData();

  const param = useSearchParams();
  const city = param.get("city") || "";
  const businesses = useFilteredBusinesses(data?.data.business || []);

  if (isLoading) return <LandingPageSkeleton />;
  return (
    <div className="container-modern md:pt-14">
      <div className=" px-4 pt-2 md:pt-6">
        <CardSlider
          title=""
          icon={<Star className="h-3 w-3 md:h-5 md:w-5 text-white" />}
        >
          {data?.data?.sponser?.map((item: any) => (
            <FeaturedCard key={item._id} item={item} />
          ))}
        </CardSlider>
      </div>

      {/* <div className=" !pr-0  pt-1 md:pt-6">
        <h1>Top Businesses in Canberra</h1>
        {data?.data?.business && data.data.business.length > 0 ? (
          <Carousel className="w-full ">
            <CarouselContent>
              {data.data.business.map((item: any) => (
                <CarouselItem key={item._id} className="basis-1/2 lg:basis-1/2">
                  <FeaturedCard key={item._id} item={item} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        ) : (
          <div className="mt-2 text-sm text-muted-foreground">
            No featured businesses available right now.
          </div>
        )}
      </div> */}

      <div className="mt-2 md:mt-4 bg-white text-black rounded-t-3xl px-4 md:px-6">
        <div className="container-modern py-4 md:py-6 border-b border-divider ">
          <h2 className="pb-2 md:pb-4">
            Explore whats active right now in {city ? city : "Australia"}
          </h2>

          <div className="flex flex-wrap justify-between gap-2 mx-auto  md:max-w-full rounded-lg ">
            {[
              {
                count: data?.data?.upcomingevents?.length ?? 0,
                label: "Events",
                color: "bg-primary/10 text-primary",
                hover: "hover:bg-primary/20",
                href: "/events",
                icon: Calendar,
              },
              {
                count: data?.data?.deals?.length ?? 0,
                label: "Deals",
                color: "bg-secondary/10 text-secondary",
                hover: "hover:bg-secondary/20",
                href: "/deals",
                icon: Tag,
              },
              {
                count: data?.data?.business?.length,
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
                className={`flex-1  p-2 md:p-4 rounded-lg shadow-sm text-black bg-white/40 border border-secondary/20 backdrop-blur-sm transition-all ${stat.color} ${stat.hover} hover:shadow-md flex items-center justify-center sm:flex-col sm:text-center`}
              >
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

        <div className="container-modern pt-2 pb-4 md:py-6 !pr-0 border-b border-divider">
          <CardSlider
            title={`Upcoming Events in ${city ? city : "Australia"}`}
            icon={<Calendar className="h-5 w-5 text-primary" />}
            viewAllHref="/events"
          >
            {data?.data?.length === 0 ? (
              <PlaceholderCard type="events" />
            ) : (
              data?.data?.upcomingevents &&
              data?.data?.upcomingevents
                .slice(0, 6)
                .map((events: any) => (
                  <EventCard key={events.id} event={events} />
                ))
            )}
          </CardSlider>
        </div>

        {/* <div className="pt-2 pb-4 md:py-6 pr-0 border-b border-divider">
          <CardSlider
            title="Active Deals"
            icon={<Tag className="h-5 w-5 text-primary" />}
            viewAllHref="/deals"
          >
            {(data?.data?.deals?.length ?? 0) === 0 ? (
              <PlaceholderCard type="deals" />
            ) : (
              data?.data?.deals
                ?.slice(0, 6)
                .map((deal: any) => <DealCard key={deal._id} deal={deal} />)
            )}
          </CardSlider>
        </div> */}

        <div className=" pt-2 pb-4 md:py-6 !pr-0 border-b border-divider">
          <CardSlider
            title={`Businesses in ${city ? city : "Australia"}`}
            icon={<Building className="h-5 w-5 text-primary" />}
            viewAllHref="/businesses"
          >
            {businesses && businesses.length === 0 ? (
              <PlaceholderCard type="businesses" />
            ) : (
              businesses &&
              businesses
                .slice(0, 6)
                .map((business: any) => (
                  <BusinessCard key={business.id} business={business} />
                ))
            )}
          </CardSlider>
        </div>

        <div className="pt-2 pb-4 md:py-6  border-b border-divider">
          <div className="card-lg !rounded-lg p-2 md:p-6 lg:p-8">
            <div className="text-center mb-2 md:mb-6">
              <div className="flex items-center justify-center space-x-3  md:mb-4">
                <div className="p-2 bg-primary rounded-lg">
                  <Users className="h-4 w-4 md:h-5 md:w-5 text-white" />
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
                aria-label="Email"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
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
                aria-label="Instagram"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
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
                aria-label="Facebook"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 fill-current"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
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
                aria-label="TikTok"
              >
                <svg
                  className="w-5 h-5 md:w-6 md:h-6 fill-current"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                >
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

      <div className=" px-6 py-4 md:py-6">
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
