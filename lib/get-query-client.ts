import { QueryClient, isServer } from "@tanstack/react-query";

// Official TanStack Query / Next.js App Router pattern. A single
// module-scope `new QueryClient()` (the previous setup) is shared across
// every SSR request on the server — one request's cached data (or a
// user-specific query) can leak into another's render. The server always
// gets a fresh client per call; the browser keeps one singleton so client
// navigations/refetches share a cache as normal.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (isServer) {
    return makeQueryClient();
  }
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}
