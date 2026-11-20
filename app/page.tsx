import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import BusinessesClientPage from "@/components/Business/BusinessPage";
// Old marketing landing page — kept for future reference, not deleted.
// import LandingPage from "@/components/LandingPage/LandingPage";
import { buildMetadata } from "@/lib/seo";
import { getQueryClient } from "@/lib/get-query-client";
import { businessQueryKey } from "@/lib/queries/business-query";
import { eventsQueryKey } from "@/lib/queries/events-query";
import { getBusinessListData } from "@/server/lib/getBusinessListData";
import { getEventsListData } from "@/server/lib/getEventsListData";

export const metadata = buildMetadata({
  title: "Nepali Events & Businesses in Australia | What's Happening Australia",
  description:
    "Discover upcoming Nepali concerts, festivals and community events near you, plus Nepali-owned businesses and deals across Australia.",
  path: "/",
});

type SearchParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // BusinessesClientPage (the Fresha-matched search/listing UI shared by
  // "/" and "/search") fetches BOTH businesses and events unconditionally
  // on mount, regardless of which tab is showing, so both get prefetched
  // here - see BusinessPage.tsx's useGetBusiness()/useGetAllEvents() calls.
  const sp = await searchParams;
  const businessParams = {
    category: one(sp.category),
    search: one(sp.search),
    service: one(sp.service),
    city: one(sp.city),
    community: one(sp.community),
    lat: one(sp.lat),
    lng: one(sp.lng),
    radius: one(sp.radius),
    swLat: one(sp.swLat),
    swLng: one(sp.swLng),
    neLat: one(sp.neLat),
    neLng: one(sp.neLng),
  };
  const eventsParams = {
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
  const [businessData, eventsData] = await Promise.all([
    getBusinessListData(businessParams),
    getEventsListData(eventsParams),
  ]);
  queryClient.setQueryData(businessQueryKey(businessParams), businessData);
  queryClient.setQueryData(eventsQueryKey(eventsParams), eventsData);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BusinessesClientPage />
    </HydrationBoundary>
  );
  // return <LandingPage />;
}
