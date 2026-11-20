// Shown while the real event data loads, built from whatever the search
// card already had (components/cards/event-card.tsx seeds this into React
// Query on hover/touch, under the ["eventPreview", slug] key). Mirrors the
// real page's hero/title/venue/date layout closely enough that swapping to
// EventDetailPage's own markup once the real data arrives doesn't jump
// around, but isn't trying to be pixel-identical — it's a loading state.
export type EventPreview = {
  title: string;
  venue: string;
  dateLabel: string;
  previewImageSrc: string;
};

export default function EventPreviewShell({
  preview,
}: {
  preview: EventPreview;
}) {
  return (
    <div className="relative md:container-modern mx-auto md:p-6 pb-20 md:pb-0 md:mt-20">
      <div className="flex flex-col md:flex-col">
        <div className="order-2 md:order-1 mt-4 md:mt-0 mb-4 px-6 md:px-0">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            {preview.title}
          </h1>
          <div className="mt-3 flex items-center gap-2 text-base text-muted-foreground">
            <span className="font-medium text-foreground">{preview.venue}</span>
            <span aria-hidden>•</span>
            <span className="font-medium text-foreground">{preview.dateLabel}</span>
          </div>
        </div>

        <div className="order-1 md:order-2">
          <div className="relative h-80 md:h-[70vh] w-full md:rounded-xl overflow-hidden bg-muted">
            {/* Plain <img>, not next/image — this exact URL (same size/
               format Next's optimizer already picked for the card) is
               what's actually sitting in the browser's image cache, so
               this paints instantly with no network request at all. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.previewImageSrc}
              alt={preview.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
