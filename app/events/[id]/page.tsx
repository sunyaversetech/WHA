import type { Metadata } from "next";
import { cache } from "react";
import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";
import { absoluteUrl, SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/seo";
import JsonLd from "@/components/SEO/JsonLd";
import EventDetailPage from "@/components/Event/SingleEventPage";

type Props = { params: Promise<{ id: string }> };

function truncate(text: string, max: number) {
  if (!text) return text;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// cache() dedupes this within a single request, so generateMetadata and the
// page body both calling it only hits the DB once.
const getEvent = cache(async (slug: string) => {
  await connectToDb();
  return Event.findOne({ slug })
    .select(
      "title description venue location city_name image dateRange startTime endTime ticket_price price_category archived",
    )
    .populate("user", "business_name")
    .lean<any>();
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);

  if (!event) {
    return { title: "Event not found", robots: { index: false, follow: false } };
  }

  const place = event.venue || event.location || event.city_name;
  const title = place ? `${event.title} — ${place}` : event.title;
  const description = truncate(
    event.description?.replace(/\s+/g, " ").trim() ||
      `${event.title}${place ? ` in ${place}` : ""}. Find event details and get your ticket on What's Happening Australia.`,
    160,
  );
  const url = absoluteUrl(`/events/${id}`);
  const image = event.image ? { url: event.image, alt: event.title } : DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: { canonical: url },
    // Archived events still have a real page, but there's no reason to let
    // search engines keep indexing something that's no longer live.
    robots: event.archived ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const event = await getEvent(id);
  const url = absoluteUrl(`/events/${id}`);

  if (!event) {
    return <EventDetailPage />;
  }

  const startDate = event.dateRange?.from
    ? `${event.dateRange.from}${event.startTime ? `T${event.startTime}:00` : ""}`
    : undefined;
  const endDate = event.dateRange?.to
    ? `${event.dateRange.to}${event.endTime ? `T${event.endTime}:00` : ""}`
    : undefined;

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description?.replace(/\s+/g, " ").trim(),
    startDate,
    endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue || event.location || event.city_name,
      address: event.location || event.city_name,
    },
    image: event.image ? [event.image] : [DEFAULT_OG_IMAGE.url],
    url,
    ...(event.user?.business_name && {
      organizer: { "@type": "Organization", name: event.user.business_name },
    }),
    ...(event.price_category !== "registration" &&
      event.ticket_price != null && {
        offers: {
          "@type": "Offer",
          price: event.ticket_price,
          priceCurrency: "AUD",
          availability: "https://schema.org/InStock",
          url,
        },
      }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Events", item: `${SITE_URL}/events` },
      { "@type": "ListItem", position: 3, name: event.title, item: url },
    ],
  };

  return (
    <>
      <JsonLd data={eventJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <EventDetailPage />
    </>
  );
}
