import type { MetadataRoute } from "next";
import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";
import { Deal } from "@/server/models/DealSchema.model";
import User from "@/server/models/Auth.model";
import { SITE_URL } from "@/lib/seo";

// Regenerate at most once an hour — new events/deals/businesses get picked
// up without needing a full redeploy, without hitting the DB on every crawl.
export const revalidate = 3600;

const slugify = (s: string) => s?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? "";

const STATIC_ROUTES = [
  { url: "", changeFrequency: "daily", priority: 1 },
  { url: "/events", changeFrequency: "hourly", priority: 0.9 },
  { url: "/deals", changeFrequency: "hourly", priority: 0.9 },
  { url: "/search", changeFrequency: "daily", priority: 0.8 },
  { url: "/bookings", changeFrequency: "weekly", priority: 0.6 },
  { url: "/privacy-policy", changeFrequency: "yearly", priority: 0.2 },
  { url: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.2 },
  { url: "/terms-of-service", changeFrequency: "yearly", priority: 0.2 },
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectToDb();

  const [events, deals, businesses] = await Promise.all([
    Event.find({ archived: { $ne: true } }, "slug updatedAt").lean(),
    Deal.find({ valid_till: { $gte: new Date() } }, "_id updatedAt").lean(),
    User.find(
      { category: "business", isblocked: { $ne: true }, deletedAt: null },
      "business_name updatedAt",
    ).lean(),
  ]);

  const eventEntries: MetadataRoute.Sitemap = events
    .filter((e: any) => e.slug)
    .map((e: any) => ({
      url: `${SITE_URL}/events/${e.slug}`,
      lastModified: e.updatedAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const dealEntries: MetadataRoute.Sitemap = deals.map((d: any) => ({
    url: `${SITE_URL}/deals/${d._id}`,
    lastModified: d.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const businessEntries: MetadataRoute.Sitemap = businesses
    .filter((b: any) => b.business_name)
    .map((b: any) => ({
      url: `${SITE_URL}/businesses/${slugify(b.business_name)}`,
      lastModified: b.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((entry) => ({
    ...entry,
    url: `${SITE_URL}${entry.url}`,
  }));

  return [...staticEntries, ...eventEntries, ...dealEntries, ...businessEntries];
}
