// Single source of truth for the /deals listing's React Query key and
// param defaults - see events-query.ts for why this needs to be shared
// between the client hook and the server page.tsx prefetch.
export type DealsQueryParams = {
  category?: string | null;
  search?: string | null;
  from?: string | null;
  to?: string | null;
  city?: string | null;
};

export function normalizeDealsParams(p: DealsQueryParams) {
  return {
    category: p.category || "",
    search: p.search || "",
    from: p.from || "",
    to: p.to || "",
    city: p.city || "",
  };
}

export function dealsQueryKey(p: DealsQueryParams): string[] {
  const n = normalizeDealsParams(p);
  return ["all-deals", n.category, n.search, n.from, n.to, n.city];
}
