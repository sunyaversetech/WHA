import type { Metadata } from "next";
import { cache } from "react";
import { connectToDb } from "@/lib/db";
import { Deal } from "@/server/models/DealSchema.model";
import { absoluteUrl, SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/seo";
import { slugOrIdFilter } from "@/server/lib/slug";
import JsonLd from "@/components/SEO/JsonLd";
import DealDetailPage from "@/components/Deal/SingleDealPage";

type Props = { params: Promise<{ id: string }> };

function truncate(text: string, max: number) {
  if (!text) return text;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// cache() dedupes this within a single request, so generateMetadata and the
// page body both calling it only hits the DB once. Accepts either the new
// slug or a legacy raw id (see slugOrIdFilter).
//
// connectToDb() swallows its own connection errors instead of throwing
// (lib/db.ts) — a transient DB hiccup otherwise surfaces as an uncaught
// Mongoose buffering-timeout error here and takes down the whole page with
// a 500, even though this is an SEO/metadata enhancement layered on top of
// a page whose real content comes from the client component's own fetch.
const getDeal = cache(async (id: string) => {
  try {
    await connectToDb();
    return await Deal.findOne(slugOrIdFilter(id))
      .select("slug title description city discount_percentage price image valid_till")
      .populate("user", "business_name")
      .lean<any>();
  } catch (err) {
    console.error(`getDeal(${id}): DB fetch failed, degrading gracefully`, err);
    // undefined (DB error) vs null (query ran, no such deal) — generateMetadata
    // only noindexes the genuine case, not a transient hiccup.
    return undefined;
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const deal = await getDeal(id);

  if (deal === null) {
    return { title: "Deal not found", robots: { index: false, follow: false } };
  }
  if (!deal) {
    return {};
  }

  const discount = deal.discount_percentage
    ? `${deal.discount_percentage}% off — `
    : "";
  const title = `${discount}${deal.title}${deal.city ? ` in ${deal.city}` : ""}`;
  const description = truncate(
    deal.description?.replace(/\s+/g, " ").trim() ||
      `${deal.title}${deal.city ? ` in ${deal.city}` : ""}. Redeem this deal on What's Happening Australia.`,
    160,
  );
  const url = absoluteUrl(`/deals/${deal.slug || id}`);
  const image = deal.image ? { url: deal.image, alt: deal.title } : DEFAULT_OG_IMAGE;
  const expired = deal.valid_till && new Date(deal.valid_till) < new Date();

  return {
    title,
    description,
    alternates: { canonical: url },
    robots: expired ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
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
  const deal = await getDeal(id);
  const url = deal ? absoluteUrl(`/deals/${deal.slug || id}`) : absoluteUrl(`/deals/${id}`);

  if (!deal) {
    return <DealDetailPage params={{ id }} />;
  }

  const offerJsonLd = {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: deal.title,
    description: deal.description?.replace(/\s+/g, " ").trim(),
    url,
    image: deal.image || DEFAULT_OG_IMAGE.url,
    ...(deal.price != null && { price: deal.price, priceCurrency: "AUD" }),
    ...(deal.valid_till && {
      validThrough: new Date(deal.valid_till).toISOString(),
    }),
    availability: "https://schema.org/InStock",
    ...(deal.user?.business_name && {
      seller: { "@type": "Organization", name: deal.user.business_name },
    }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Deals", item: `${SITE_URL}/deals` },
      { "@type": "ListItem", position: 3, name: deal.title, item: url },
    ],
  };

  return (
    <>
      <JsonLd data={offerJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <DealDetailPage params={{ id }} />
    </>
  );
}
