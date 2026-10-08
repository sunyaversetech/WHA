import type { Metadata } from "next";
import { connectToDb } from "@/lib/db";
import { resolveBusinessBySlugOrId } from "@/lib/resolve-business";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo";
import BusinessPage from "@/components/Business/SingleBusinessPage/SingleBusinessPage";

type Props = { params: Promise<{ id: string }> };

function truncate(text: string, max: number) {
  if (!text) return text;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  await connectToDb();
  const business = await resolveBusinessBySlugOrId(id);

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

export default BusinessPage;
