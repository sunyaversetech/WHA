"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { QRCodeCanvas } from "qrcode.react";
import { useGetTickets } from "@/services/dashboard.service";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  MapPin,
  CalendarDays,
  Ticket as TicketIcon,
  ExternalLink,
  CheckCircle2,
  Clock,
} from "lucide-react";
import {
  getTicketTitle,
  getTicketImage,
  getTicketVenue,
  getTicketDateRange,
  getTicketCodes,
  isEventItem,
  getSourceHref,
  getMapHref,
  formatDateLong,
  formatTime,
} from "./ticket-utils";

const DetailSkeleton = () => (
  <div className="min-h-screen max-w-lg mx-auto px-4 py-4 space-y-5">
    <Skeleton className="h-9 w-9 rounded-full" />
    <Skeleton className="h-40 w-full rounded-2xl" />
    <Skeleton className="h-72 w-full rounded-2xl" />
    <Skeleton className="h-24 w-full rounded-2xl" />
  </div>
);

const NotFoundState = ({ onBack }: { onBack: () => void }) => (
  <div className="min-h-screen max-w-lg mx-auto px-4 py-16 text-center flex flex-col items-center gap-4">
    <TicketIcon className="h-10 w-10 text-muted-foreground/40" />
    <div>
      <p className="font-bold text-foreground">Ticket not found</p>
      <p className="text-sm text-muted-foreground mt-1">
        This ticket may have been removed or the link is incorrect.
      </p>
    </div>
    <Button variant="outline" onClick={onBack}>
      Back to Activity
    </Button>
  </div>
);

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const { data, isLoading } = useGetTickets();

  const tickets: any[] = data?.data || [];
  const item = tickets.find((t) => t._id === id);

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrent(api.selectedScrollSnap());
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    api.emit("select");
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api]);

  if (isLoading) return <DetailSkeleton />;
  if (!item) return <NotFoundState onBack={() => router.push("/activity")} />;

  const isEvent = isEventItem(item);
  const title = getTicketTitle(item);
  const image = getTicketImage(item);
  const venue = getTicketVenue(item);
  const dateRange = getTicketDateRange(item);
  const codes = getTicketCodes(item);
  const mapHref = getMapHref(item);
  const sourceHref = getSourceHref(item);
  const holderName = session?.user?.name || "Ticket Holder";

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-12">
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-background/95 backdrop-blur-md border-b border-border z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        {sourceHref && (
          <Link
            href={sourceHref}
            className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1">
            View {isEvent ? "event" : "deal"}
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* Summary */}
        <div className="card rounded-2xl p-5">
          {dateRange ? (
            <>
              <p className="text-lg font-extrabold text-primary">
                {formatDateLong(dateRange.from)}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {formatTime(dateRange.from)}
              </p>
            </>
          ) : (
            item?.deal?.valid_till && (
              <p className="text-sm font-bold text-primary">
                Valid till {formatDateLong(item.deal.valid_till)}
              </p>
            )
          )}

          <div className="flex items-center gap-3 mt-4">
            <div className="relative h-14 w-14 rounded-lg overflow-hidden shrink-0 bg-muted">
              {image ? (
                <Image
                  src={image}
                  alt={title}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <TicketIcon className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-base text-foreground line-clamp-2">
                {title}
              </h1>
              {venue && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {venue}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* QR codes — one per attendee/ticket */}
        <div className="card rounded-2xl p-5">
          <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
              {codes.map((code, i) => (
                <CarouselItem
                  key={code.key}
                  className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-border">
                    <QRCodeCanvas value={code.key} size={200} level="H" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <p className="text-sm font-bold text-foreground">
                      {holderName} · Ticket {i + 1} of {codes.length}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {code.label}
                    </p>
                    <span
                      className={`badge inline-flex items-center gap-1 ${
                        code.checkedIn ? "badge-success" : "badge-warning"
                      }`}>
                      {code.checkedIn ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Checked in
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3" /> Not checked in
                        </>
                      )}
                    </span>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {codes.length > 1 && (
              <>
                <CarouselPrevious className="-left-3" />
                <CarouselNext className="-right-3" />
                <div
                  className="flex justify-center gap-1.5 mt-5"
                  role="tablist"
                  aria-label="Ticket pages">
                  {codes.map((code, i) => (
                    <span
                      key={code.key}
                      role="tab"
                      aria-selected={i === current}
                      className={`h-1.5 rounded-full transition-all ${
                        i === current ? "w-5 bg-secondary" : "w-1.5 bg-border"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </Carousel>
        </div>

        {/* Date & time */}
        {dateRange && (
          <div className="card rounded-2xl p-5">
            <h2 className="text-sm font-bold text-foreground mb-3">
              Date and time
            </h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4 text-secondary shrink-0" />
              <span>
                {formatDateLong(dateRange.from)} · {formatTime(dateRange.from)}
                {dateRange.to ? ` – ${formatTime(dateRange.to)}` : ""}
              </span>
            </div>
          </div>
        )}

        {/* Location */}
        {venue && (
          <div className="card rounded-2xl p-5">
            <h2 className="text-sm font-bold text-foreground mb-3">
              Location
            </h2>
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
              <span>{venue}</span>
            </div>
            {mapHref && (
              <a
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline mt-3">
                View map <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        )}

        {/* Order details */}
        {item.invoiceNumber && (
          <div className="card rounded-2xl p-5 space-y-2">
            <h2 className="text-sm font-bold text-foreground mb-1">
              Order details
            </h2>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Invoice</span>
              <span className="font-mono">{item.invoiceNumber}</span>
            </div>
            {typeof item.totalAmount === "number" && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Total paid</span>
                <span className="font-semibold text-foreground">
                  ${item.totalAmount.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
