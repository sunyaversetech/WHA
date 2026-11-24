import type { Metadata } from "next";
import { cache } from "react";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { connectToDb } from "@/lib/db";
import { getCachedSingleEventData } from "@/server/lib/getSingleEventData";
import { getQueryClient } from "@/lib/get-query-client";
import { absoluteUrl, SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/seo";
import JsonLd from "@/components/SEO/JsonLd";
import EventDetailPage from "@/components/Event/SingleEventPage";
import { formatEventJsonLdDateTime } from "@/lib/event-date";
import { deriveAddressRegion, extractAuStateFromCity } from "@/lib/au-address";

type Props = { params: Promise<{ id: string }> };

function truncate(text: string, max: number) {
  if (!text) return text;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// Matches the client page's own slug normalization (SingleEventPage.tsx) so
// the server-fetched data lands under the same React Query key the client
// hook (useGetSingleEvent) looks for — in practice a no-op, since real
// slugs are already lowercase/alphanumeric, but keeps them guaranteed
// identical rather than assumed identical.
function normalizeSlug(id: string) {
  return id.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// cache() dedupes this within a single request, so generateMetadata and the
// page body share one call — which itself hits getCachedSingleEventData,
// a 60s-revalidated cache shared across requests/users (see
// server/lib/getSingleEventData.ts for why and its staleness tradeoffs).
//
// connectToDb() swallows its own connection errors instead of throwing
// (lib/db.ts), so a transient DB hiccup leaves the connection not actually
// ready and the query below fails on its own (Mongoose's buffering-timeout
// error) — uncaught, that was taking down the whole page with a 500 even
// though this is purely an SEO/metadata enhancement layered on top of a
// page whose real content comes from the client component's own fetch. A
// failure here should degrade to "render without the enhancement", never
// crash the page.
const getEvent = cache(async (slug: string) => {
  try {
    await connectToDb();
    return await getCachedSingleEventData(normalizeSlug(slug));
  } catch (err) {
    console.error(`getEvent(${slug}): DB fetch failed, degrading gracefully`, err);
    // undefined (DB error) vs null (query ran, no such event) — generateMetadata
    // and Page below only noindex the genuine case, not a transient hiccup.
    return undefined;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);

  if (event === null) {
    return { title: "Event not found", robots: { index: false, follow: false } };
  }
  if (!event) {
    // DB error — fall back to generic site metadata rather than falsely
    // telling crawlers this page doesn't exist.
    return {};
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

  const queryClient = getQueryClient();
  if (event) {
    // Same shape the client's useGetSingleEvent/useFetcher expects from
    // GET /api/event/single-event/[id], and the same query key
    // (["singleEvent", slug]) it reads — so the client mounts with this
    // data already in cache instead of re-fetching it from scratch.
    queryClient.setQueryData(["singleEvent", normalizeSlug(id)], {
      message: "Event fetched successfully",
      data: event,
    });
  }

  if (!event) {
    return <EventDetailPage />;
  }

  const startDate = formatEventJsonLdDateTime(event.dateRange?.from, event.startTime);
  const endDate = formatEventJsonLdDateTime(event.dateRange?.to, event.endTime);

  // Real venue takes priority; a TBA (or simply missing) venue falls back
  // to a city-level Place instead of inventing a venue name ("To Be
  // Announced" was going straight into the Place name before this). If
  // there's no venue AND no city either, there's nothing honest to put
  // in `location` at all - skip the whole Event block below rather than
  // emit one Google would flag as invalid.
  const cityName = event.city_name || event.city || null;
  const hasRealVenue = !!event.venue && !event.location_tba;
  const region = hasRealVenue
    ? deriveAddressRegion({
        addressText: event.location,
        lat: event.latitude,
        lng: event.longitude,
      })
    : extractAuStateFromCity(cityName) ??
      deriveAddressRegion({
        addressText: event.location,
        lat: event.latitude,
        lng: event.longitude,
      });

  const location =
    hasRealVenue || cityName
      ? {
          "@type": "Place",
          name: hasRealVenue ? event.venue : cityName,
          address: {
            "@type": "PostalAddress",
            ...(cityName && { addressLocality: cityName }),
            ...(region && { addressRegion: region }),
            addressCountry: "AU",
          },
        }
      : null;

  const eventJsonLd = location && {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description?.replace(/\s+/g, " ").trim(),
    startDate,
    endDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location,
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
    <HydrationBoundary state={dehydrate(queryClient)}>
      {eventJsonLd && <JsonLd data={eventJsonLd} />}
      <JsonLd data={breadcrumbJsonLd} />
      <EventDetailPage />
    </HydrationBoundary>
  );
}
