import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import DealsPageClient from "@/components/Deal/DealsPageClient";
import { buildMetadata, SITE_NAME } from "@/lib/seo";
import { getQueryClient } from "@/lib/get-query-client";
import { dealsQueryKey } from "@/lib/queries/deals-query";
import { getDealsListData } from "@/server/lib/getDealsListData";

export const metadata = buildMetadata({
  title: `Deals | ${SITE_NAME}`,
  description:
    "Find the best deals and offers from Nepali-owned businesses across Australia.",
  path: "/deals",
});

type SearchParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const params = {
    category: one(sp.category),
    search: one(sp.search),
    from: one(sp.from),
    to: one(sp.to),
    city: one(sp.city),
  };

  const queryClient = getQueryClient();
  const data = await getDealsListData(params);
  queryClient.setQueryData(dealsQueryKey(params), data);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DealsPageClient />
    </HydrationBoundary>
  );
}
