import type { Metadata } from "next";
import mongoose from "mongoose";
import { connectToDb } from "@/lib/db";
import { Deal } from "@/server/models/DealSchema.model";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo";
import DealDetailPage from "@/components/Deal/SingleDealPage";

type Props = { params: Promise<{ id: string }> };

function truncate(text: string, max: number) {
  if (!text) return text;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { title: "Deal not found", robots: { index: false, follow: false } };
  }

  await connectToDb();
  const deal = await Deal.findById(id)
    .select("title description city discount_percentage image valid_till")
    .lean<any>();

  if (!deal) {
    return { title: "Deal not found", robots: { index: false, follow: false } };
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
  const url = absoluteUrl(`/deals/${id}`);
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

export default DealDetailPage;
