"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
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
  Download,
  Share2,
  Share,
  LucideShare2,
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
import { format, parse } from "date-fns";

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
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

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

  console.log("TicketDetailPage item:", item);

  const loadLogo = (): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = "/wha/logo.png";
    });

  const buildTicketPdf = (logo: HTMLImageElement | null) => {
    const doc = new jsPDF({ unit: "mm", format: [100, 160] });

    codes.forEach((code, i) => {
      if (i > 0) doc.addPage([100, 160]);

      if (logo) {
        const logoW = 12;
        const logoH = (logo.height / logo.width) * logoW;
        doc.addImage(logo, "PNG", 100 - 10 - logoW, 6, logoW, logoH);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(title, 50, 20, { align: "center", maxWidth: 70 });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      let y = 28;
      if (dateRange) {
        const dateLine = `${new Date(dateRange.from).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })} · ${formatTime(dateRange.from)}`;
        doc.text(dateLine, 50, y, { align: "center" });
        y += 5;
      }
      if (venue) {
        doc.text(venue, 50, y, { align: "center", maxWidth: 90 });
        y += 5;
      }

      const canvas = canvasRefs.current.get(code.key);
      if (canvas) {
        doc.addImage(canvas.toDataURL("image/png"), "PNG", 20, y + 5, 60, 60);
      }

      const qrBottom = y + 5 + 60;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(holderName, 50, qrBottom + 7, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(
        `Ticket ${i + 1} of ${codes.length} · ${code.label}`,
        50,
        qrBottom + 12,
        { align: "center" },
      );
    });

    return doc;
  };

  const ticketFileName = `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-ticket.pdf`;

  const handleDownload = async () => {
    try {
      const logo = await loadLogo();
      const doc = buildTicketPdf(logo);
      doc.save(ticketFileName);
    } catch {
      toast.error("Couldn't download ticket");
    }
  };

  const invoiceLineItems = item.items?.length
    ? item.items
    : [
        {
          optionName: title,
          quantity: 1,
          unitPrice: item.ticketTotal ?? item.totalAmount ?? 0,
        },
      ];

  const buildInvoicePdf = (logo: HTMLImageElement | null) => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageWidth = 210;
    let y = 20;

    if (logo) {
      const logoW = 22;
      const logoH = (logo.height / logo.width) * logoW;
      doc.addImage(logo, "PNG", 14, y, logoW, logoH);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Invoice", pageWidth - 14, y + 8, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Invoice #: ${item.invoiceNumber}`, pageWidth - 14, y + 15, {
      align: "right",
    });
    if (item.createdAt) {
      doc.text(
        new Date(item.createdAt).toLocaleDateString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
        pageWidth - 14,
        y + 20,
        { align: "right" },
      );
    }

    y += 32;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(title, 14, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100);
    if (venue) {
      doc.text(venue, 14, y);
      y += 5;
    }
    if (dateRange) {
      doc.text(formatDateLong(dateRange.from), 14, y);
      y += 5;
    }
    doc.setTextColor(0);

    y += 6;
    doc.setDrawColor(220);
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Description", 14, y);
    doc.text("Qty", 150, y, { align: "right" });
    doc.text("Amount", pageWidth - 14, y, { align: "right" });
    y += 3;
    doc.line(14, y, pageWidth - 14, y);
    y += 6;

    doc.setFont("helvetica", "normal");
    invoiceLineItems.forEach((li: any) => {
      doc.text(li.optionName || "Ticket", 14, y);
      doc.text(String(li.quantity), 150, y, { align: "right" });
      doc.text(
        `$${(li.unitPrice * li.quantity).toFixed(2)}`,
        pageWidth - 14,
        y,
        { align: "right" },
      );
      y += 6;
    });

    y += 2;
    doc.line(14, y, pageWidth - 14, y);
    y += 8;

    const summaryRow = (label: string, value: string, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.text(label, 150, y, { align: "right" });
      doc.text(value, pageWidth - 14, y, { align: "right" });
      y += 6;
    };

    summaryRow("Service fee", `$${(item.serviceFee ?? 0).toFixed(2)}`);
    summaryRow("Surcharge", `$${(item.surcharge ?? 0).toFixed(2)}`);
    if (item.promoCode) {
      summaryRow("Promo code", item.promoCode.toUpperCase());
    }
    y += 2;
    doc.line(150, y, pageWidth - 14, y);
    y += 6;
    summaryRow("Total paid", `$${(item.totalAmount ?? 0).toFixed(2)}`, true);

    y += 15;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text("Service and processing fees are non-refundable.", 14, y);

    return doc;
  };

  const invoiceFileName = `invoice-${item.invoiceNumber || "ticket"}.pdf`;

  const handleDownloadInvoice = async () => {
    try {
      const logo = await loadLogo();
      const doc = buildInvoicePdf(logo);
      doc.save(invoiceFileName);
    } catch {
      toast.error("Couldn't download invoice");
    }
  };

  const handleShare = async () => {
    const shareUrl = sourceHref
      ? `${window.location.origin}${sourceHref}`
      : window.location.href;
    const shareText = venue ? `${title} · ${venue}` : title;

    try {
      const logo = await loadLogo();
      const doc = buildTicketPdf(logo);
      const file = new File([doc.output("blob")], ticketFileName, {
        type: "application/pdf",
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text: shareText });
      } else if (navigator.share) {
        await navigator.share({ title, text: shareText, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard");
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") toast.error("Couldn't share ticket");
    }
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto pb-12 md:mt-20">
      <div className="flex items-center justify-between px-4 py-3 sticky top-0 bg-background/95 backdrop-blur-md  z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Back">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <button
          type="button"
          onClick={handleShare}
          className="text-primary hover:text-primary/80"
          aria-label="Share">
          <Share className="h-5 w-5" />
        </button>
      </div>

      <div className="px-4 pt-4 space-y-5">
        {/* QR codes — one per attendee/ticket */}
        <div className="card rounded-2xl p-5">
          <div className="flex justify-between">
            <div className="flex items-center gap-3 mt-2 mb-4">
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
              </div>
            </div>
            {/* logo WHA */}
            <div>
              <img
                src="/wha/logo.png"
                alt="Company logo"
                className="h-14 w-14 object-contain"
              />
            </div>
          </div>

          <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
              {codes.map((code, i) => (
                <CarouselItem
                  key={code.key}
                  className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-border">
                    <QRCodeCanvas
                      value={code.key}
                      size={200}
                      level="H"
                      ref={(el) => {
                        if (el) canvasRefs.current.set(code.key, el);
                      }}
                    />
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
                {/* <CarouselPrevious className="-left-3" />
                <CarouselNext className="-right-3" /> */}
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
        {/* Date & Time & Location */}
        {(dateRange || venue) && (
          <div className="card rounded-2xl p-5 space-y-5">
            {/* Date & Time */}
            {dateRange && (
              <div>
                <h2 className="text-sm font-bold text-foreground mb-3">
                  Date and time
                </h2>

                <div className="text-sm text-muted-foreground">
                  <span>
                    {new Date(dateRange.from).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                  {" · "}
                  <span>
                    {item.event?.startTime &&
                      format(
                        parse(item.event?.startTime, "HH:mm", new Date()),
                        "h:mm aa",
                      )}
                  </span>
                  {" - "}
                  {item.event?.endTime &&
                    format(
                      parse(item.event?.endTime, "HH:mm", new Date()),
                      "h:mm aa",
                    )}
                </div>
              </div>
            )}

            {/* Location */}
            {venue && (
              <div>
                <h2 className="text-sm font-bold text-foreground mb-3">
                  Location
                </h2>

                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                  <span>{venue}</span>
                </div>

                {mapHref && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline mt-3">
                    View map
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* Invoice breakdown */}
        {item.invoiceNumber && (
          <div className="card rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">Invoice</h2>
              <span className="text-xs font-mono text-muted-foreground">
                {item.invoiceNumber}
              </span>
            </div>

            <div className="divide-y divide-border">
              {invoiceLineItems.map((li: any, i: number) => (
                <div key={i} className="flex justify-between py-2 text-sm">
                  <span className="text-muted-foreground">
                    {li.optionName || "Ticket"} × {li.quantity}
                  </span>
                  <span className="font-medium text-foreground">
                    ${(li.unitPrice * li.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Service fee</span>
                <span className="font-medium text-foreground">
                  ${(item.serviceFee ?? 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="text-muted-foreground">Surcharge</span>
                <span className="font-medium text-foreground">
                  ${(item.surcharge ?? 0).toFixed(2)}
                </span>
              </div>
              {item.promoCode && (
                <div className="flex justify-between py-2 text-sm">
                  <span className="text-emerald-600">Promo code applied</span>
                  <span className="font-medium text-emerald-600">
                    {item.promoCode.toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-sm font-bold text-foreground">
                Total paid
              </span>
              <span className="text-base font-bold text-foreground">
                ${(item.totalAmount ?? 0).toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Download */}
        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={handleDownload}>
            <Download className="h-4 w-4" />
            Download Ticket
          </Button>
          {item.invoiceNumber && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleDownloadInvoice}>
              <Download className="h-4 w-4" />
              Download Invoice
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
