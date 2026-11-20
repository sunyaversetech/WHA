import { connectToDb } from "@/lib/db";
import { Deal } from "@/server/models/DealSchema.model";
import { PUBLIC_ORGANIZER_FIELDS } from "@/server/lib/publicUserFields";
import {
  normalizeDealsParams,
  type DealsQueryParams,
} from "@/lib/queries/deals-query";

function escapeRegex(text: string) {
  return text.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

// Extracted from app/api/deals/get-all/route.ts (which now just parses the
// request URL and delegates here) so the same DB query can also be called
// directly from app/deals/page.tsx for server-side prefetch, without an
// HTTP round-trip to our own API route.
export async function getDealsListData(rawParams: DealsQueryParams) {
  await connectToDb();

  const normalized = normalizeDealsParams(rawParams);
  const strip = (v: string) => v.replace(/\?+$/, "").trim();
  const category = strip(normalized.category);
  const search = strip(normalized.search);
  const from = strip(normalized.from);
  const to = strip(normalized.to);
  const city = strip(normalized.city);

  const query: any = {};

  if (search) {
    const safeSearch = escapeRegex(search);
    query.title = { $regex: safeSearch, $options: "i" };
  }

  if (city) {
    query.city = { $regex: `^${escapeRegex(city)}$`, $options: "i" };
  }

  if (from || to) {
    const dateQuery: any = {};
    if (from) {
      const searchFrom = new Date(from);
      searchFrom.setHours(0, 0, 0, 0);
      dateQuery.$gte = searchFrom;
    }
    if (to) {
      const searchTo = new Date(to);
      searchTo.setHours(23, 59, 59, 999);
      dateQuery.$lte = searchTo;
    }
    query.valid_till = dateQuery;
  }

  if (category && category !== "all") {
    query.category = category;
  }

  const deals = await Deal.find(query)
    .populate("user", PUBLIC_ORGANIZER_FIELDS)
    .sort({ createdAt: -1 });

  return { message: "", data: deals };
}
