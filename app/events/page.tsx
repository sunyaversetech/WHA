import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import EventsPageClient from "@/components/Event/EventPage";
import { buildMetadata, SITE_NAME } from "@/lib/seo";
import { getQueryClient } from "@/lib/get-query-client";
import { eventsQueryKey } from "@/lib/queries/events-query";
import { getEventsListData } from "@/server/lib/getEventsListData";

export const metadata = buildMetadata({
  title: `Events | ${SITE_NAME}`,
  description:
    "Discover upcoming Nepali community events near you, across Australia.",
  path: "/events",
});

type SearchParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Reading searchParams here makes this route dynamic (one DB hit per
  // visit instead of a build-time static page) - the trade-off is
  // necessary: this is also what lets EventsPageClient's own
  // useSearchParams() calls render their real content immediately during
  // SSR instead of needing a Suspense fallback (that requirement only
  // applies to routes attempting static generation; a genuinely dynamic
  // route has real params available synchronously, so nothing suspends).
  const sp = await searchParams;
  const params = {
    category: one(sp.category),
    search: one(sp.search),
    city: one(sp.city),
    community: one(sp.community),
    from: one(sp.from),
    to: one(sp.to),
    lat: one(sp.lat),
    lng: one(sp.lng),
    radius: one(sp.radius),
  };

  const queryClient = getQueryClient();
  const data = await getEventsListData(params);
  queryClient.setQueryData(eventsQueryKey(params), data);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EventsPageClient />
    </HydrationBoundary>
  );
}
