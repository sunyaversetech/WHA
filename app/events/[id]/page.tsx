import type { Metadata } from "next";
import { connectToDb } from "@/lib/db";
import Event from "@/server/models/Event.model";
import { absoluteUrl, DEFAULT_OG_IMAGE } from "@/lib/seo";
import EventDetailPage from "@/components/Event/SingleEventPage";

type Props = { params: Promise<{ id: string }> };

function truncate(text: string, max: number) {
  if (!text) return text;
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  await connectToDb();
  const event = await Event.findOne({ slug: id })
    .select("title description venue location city_name image dateRange archived")
    .lean<any>();

  if (!event) {
    return { title: "Event not found", robots: { index: false, follow: false } };
  }

  const place = event.venue || event.location || event.city_name;
  const title = place ? `${event.title} — ${place}` : event.title;
  const description = truncate(
    event.description?.replace(/\s+/g, " ").trim() ||
      `${event.title}${place ? ` in ${place}` : ""}. Find event details and get your ticket on What's Happening Australia.`,
    160,
  );
  const url = absoluteUrl(`/events/${id}`);
  const image = event.image ? { url: event.image, alt: event.title } : DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    alternates: { canonical: url },
    // Archived events still have a real page, but there's no reason to let
    // search engines keep indexing something that's no longer live.
    robots: event.archived ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "article",
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

export default EventDetailPage;
