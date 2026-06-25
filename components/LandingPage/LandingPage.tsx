"use client";

import Link from "next/link";
import { Calendar, Building, Tag, Mail, MapPin } from "lucide-react";
import EventCard from "@/components/cards/event-card";
import BusinessCard from "@/components/cards/business-card";
import PlaceholderCard from "@/components/cards/placeholder-card";
import CardSlider from "@/components/ui/card-slider";
import { useFilteredBusinesses } from "@/hooks/use-filtered-data";
import { useGetLandingPageData } from "@/services/landing.service";
import LandingPageSkeleton from "./LandingPageSkeleton";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

const STAT_ITEMS = (data: any) => [
  {
    count: data?.data?.upcomingevents?.length ?? 0,
    label: "Upcoming Events",
    icon: Calendar,
    href: "/events",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    count: data?.data?.deals?.length ?? 0,
    label: "Active Deals",
    icon: Tag,
    href: "/deals",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    count: data?.data?.business?.length ?? 0,
    label: "Local Businesses",
    icon: Building,
    href: "/businesses",
    color: "text-primary",
    bg: "bg-accent",
  },
];

const InstagramIcon = () => (
  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M7.75 2h8.5A5.75 5.75 0 0122 7.75v8.5A5.75 5.75 0 0116.25 22h-8.5A5.75 5.75 0 012 16.25v-8.5A5.75 5.75 0 017.75 2zm0 1.5A4.25 4.25 0 003.5 7.75v8.5A4.25 4.25 0 007.75 20.5h8.5a4.25 4.25 0 004.25-4.25v-8.5A4.25 4.25 0 0016.25 3.5h-8.5zm8.88 2.3a1.125 1.125 0 110 2.25 1.125 1.125 0 010-2.25zM12 7a5 5 0 110 10 5 5 0 010-10zm0 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22 12a10 10 0 10-11.5 9.87v-6.99H8v-2.88h2.5v-2.2c0-2.48 1.49-3.85 3.77-3.85 1.09 0 2.23.2 2.23.2v2.45h-1.25c-1.23 0-1.61.77-1.61 1.56v1.85h2.74l-.44 2.88h-2.3v6.99A10 10 0 0022 12z"/>
  </svg>
);

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/whatshappening_australia",
    Icon: InstagramIcon,
    color: "hover:text-pink-500",
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/whatshappeningaustralia",
    Icon: FacebookIcon,
    color: "hover:text-blue-600",
  },
  {
    label: "Email",
    href: "mailto:info@whatshappeningaustralia.com",
    Icon: () => <Mail className="h-4 w-4" />,
    color: "hover:text-secondary",
  },
];

export default function LandingPage() {
  const { data, isLoading } = useGetLandingPageData();
  const param = useSearchParams();
  const city = param.get("city") || "";
  const businesses = useFilteredBusinesses(data?.data.business || []);

  if (isLoading) return <LandingPageSkeleton />;

  const stats = STAT_ITEMS(data);
  const locationLabel = city || "Australia";

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Banner ── */}
      <div className="md:pt-14">
        <div className="px-4 pt-4 md:pt-6">
          <Link
            href="https://muktiandrevival.whaustralia.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative block w-full overflow-hidden rounded-2xl shadow-lg
                       transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            aria-label="View featured promotion">
            <div className="relative aspect-[21/8] max-md:aspect-[10/5] w-full bg-slate-900">
              <Image
                fill
                src="/banner-img.png"
                alt="Promotional Advertisement"
                className="object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
                priority
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-black/10" />
            </div>
          </Link>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="bg-white rounded-t-3xl mt-3 md:mt-4">

        {/* ── Stats row ── */}
        <div className="container-modern px-4 md:px-6 pt-6 pb-4 md:pt-8 md:pb-6 border-b border-divider">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-4 w-4 text-secondary flex-shrink-0" />
            <h2 className="text-sm md:text-base font-semibold text-muted-foreground">
              What&apos;s happening in{" "}
              <span className="text-primary font-bold">{locationLabel}</span>
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <Link
                  key={stat.label}
                  href={stat.href}
                  className={`group flex flex-col items-center justify-center gap-1.5 p-3 md:p-5
                             rounded-xl border border-border ${stat.bg}
                             hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}>
                  <div className={`p-2 rounded-lg bg-white/80 shadow-sm`}>
                    <Icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                  </div>
                  <span className={`text-xl md:text-2xl font-black ${stat.color}`}>
                    {stat.count}
                  </span>
                  <span className="text-[10px] md:text-xs font-semibold text-center text-muted-foreground uppercase tracking-wide leading-tight">
                    {stat.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Upcoming Events ── */}
        <div className="container-modern px-4 md:px-6 pt-5 pb-5 md:pt-7 md:pb-7 !pr-0 border-b border-divider">
          <CardSlider
            title={`Upcoming Events in ${locationLabel}`}
            icon={<Calendar className="h-4 w-4 text-secondary" />}
            viewAllHref="/events">
            {!data?.data?.upcomingevents?.length ? (
              <PlaceholderCard type="events" />
            ) : (
              data.data.upcomingevents
                .slice(0, 6)
                .map((event: any) => <EventCard key={event.id} event={event} />)
            )}
          </CardSlider>
        </div>

        {/* ── Local Businesses ── */}
        <div className="container-modern px-4 md:px-6 pt-5 pb-5 md:pt-7 md:pb-7 !pr-0 border-b border-divider">
          <CardSlider
            title={`Businesses in ${locationLabel}`}
            icon={<Building className="h-4 w-4 text-secondary" />}
            viewAllHref="/businesses">
            {!businesses?.length ? (
              <PlaceholderCard type="businesses" />
            ) : (
              businesses
                .slice(0, 6)
                .map((business: any) => <BusinessCard key={business.id} business={business} />)
            )}
          </CardSlider>
        </div>

        {/* ── Connect with us ── */}
        <div className="px-4 md:px-6 py-6 md:py-8 border-b border-divider">
          <div className="bg-accent rounded-2xl px-5 py-6 md:px-8 md:py-8">
            <h2 className="text-sm md:text-base font-bold text-primary mb-1">
              Stay Connected
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mb-5">
              Follow What&apos;s Happening Australia for the latest events, deals & community news.
            </p>
            <div className="flex items-center gap-3 flex-wrap">
              {SOCIAL_LINKS.map(({ label, href, Icon, color }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                  aria-label={label}
                  className={`flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-border
                             text-sm font-semibold text-muted-foreground shadow-sm
                             hover:shadow transition-all duration-150 ${color}`}>
                  <Icon />
                  <span className="hidden sm:inline">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Platform notice ── */}
        <div className="px-4 md:px-6 py-4 md:py-6">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <span className="text-lg flex-shrink-0" aria-hidden="true">⚠️</span>
            <div>
              <p className="text-xs md:text-sm font-semibold text-amber-800 mb-0.5">
                Platform in Development
              </p>
              <p className="text-xs text-amber-700 leading-relaxed">
                Some information may be outdated. Please check official business sites for the most up-to-date details.
              </p>
            </div>
          </div>
        </div>

        {/* ── Footer spacer for mobile bottom nav ── */}
        <div className="h-4" />
      </div>
    </div>
  );
}
