import type { Metadata } from "next";
import { cache } from "react";
import { connectToDb } from "@/lib/db";
import { resolveBusinessBySlugOrId } from "@/lib/resolve-business";
import { absoluteUrl, SITE_URL, DEFAULT_OG_IMAGE } from "@/lib/seo";
import JsonLd from "@/components/SEO/JsonLd";
import BusinessPage from "@/components/Business/SingleBusinessPage/SingleBusinessPage";

type Props = { params: Promise<{ id: string }> };

function truncate(text: string, max: number) {
  if (!text) return text;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

// cache() dedupes this within a single request, so generateMetadata and the
// page body both calling it only hits the DB once.
const getBusiness = cache(async (id: string) => {
  await connectToDb();
  return resolveBusinessBySlugOrId(id);
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const business = await getBusiness(id);

  if (!business || business.isblocked || business.deletedAt) {
    return { title: "Business not found", robots: { index: false, follow: false } };
  }

  const place = business.city_name || business.location || business.city;
  const title = place ? `${business.business_name} — ${place}` : business.business_name;
  const description = truncate(
    business.seo_description?.trim() ||
      `${business.business_name}${place ? ` in ${place}` : ""}${
        business.business_category ? ` — ${business.business_category}` : ""
      }. Find details, deals and events on What's Happening Australia.`,
    160,
  );
  const url = absoluteUrl(`/businesses/${id}`);
  const image = business.image
    ? { url: business.image, alt: business.business_name }
    : DEFAULT_OG_IMAGE;
  const keywords: string[] | undefined =
    business.seo_keywords?.length > 0 ? business.seo_keywords : undefined;

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
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
  const business = await getBusiness(id);
  const url = absoluteUrl(`/businesses/${id}`);

  if (!business || business.isblocked || business.deletedAt) {
    return <BusinessPage />;
  }

  const place = business.city_name || business.location || business.city;

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.business_name,
    description: business.seo_description?.trim(),
    image: business.image || DEFAULT_OG_IMAGE.url,
    url,
    ...(place && { address: { "@type": "PostalAddress", addressLocality: place } }),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Local Businesses", item: `${SITE_URL}/search` },
      { "@type": "ListItem", position: 3, name: business.business_name, item: url },
    ],
  };

  return (
    <>
      <JsonLd data={localBusinessJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <BusinessPage />
    </>
  );
}
