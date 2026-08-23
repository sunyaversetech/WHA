"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import { toast } from "sonner";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";
import {
  LayoutDashboard,
  Receipt,
  Users,
  QrCode,
  BarChart3,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Search,
  MoreVertical,
  Link2,
  Trash2,
  Copy,
  CheckCircle2,
  CircleDashed,
  Settings,
  Eye,
  Printer,
  Send,
  Download,
  Loader2,
} from "lucide-react";
import {
  getTicketTitle,
  getTicketVenue,
  getTicketDateRange,
  getTicketCodes,
} from "../Ticket/ticket-utils";
import {
  useGetSingleForForm,
  useGetEventVerifyUsers,
  useGetEventTicketPurchase,
  // useDeleteEvent,
  useSetTicketStatus,
  useSendInvoice,
  EventType,
} from "@/services/event.service";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DeleteConfirmDialog } from "@/components/ui/DynamicDeleteButton";
import { useQueryClient } from "@tanstack/react-query";
import VerifyEventPage from "./VerifyEvents";

type EventStatus = "upcoming" | "live" | "past" | "archived";

function getEventStatus(event: EventType): EventStatus {
  if (event.archived) return "archived";

  const from = event.dateRange?.from ? new Date(event.dateRange.from) : null;
  if (!from || isNaN(from.getTime())) return "past";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  from.setHours(0, 0, 0, 0);

  const to =
    event.dateRange?.to && !isNaN(new Date(event.dateRange.to).getTime())
      ? new Date(event.dateRange.to)
      : new Date(from);
  to.setHours(0, 0, 0, 0);

  if (today < from) return "upcoming";
  if (today > to) return "past";
  return "live";
}

const STATUS_STYLES: Record<EventStatus, { label: string; className: string }> =
  {
    upcoming: {
      label: "Upcoming",
      className: "bg-primary/10 text-primary border-primary/20",
    },
    live: {
      label: "Live",
      className: "bg-green-50 text-green-700 border-green-100",
    },
    past: {
      label: "Past",
      className: "bg-slate-100 text-slate-500 border-slate-200",
    },
    archived: {
      label: "Archived",
      className: "bg-amber-50 text-amber-700 border-amber-100",
    },
  };

function formatEventDateTime(event: EventType): string {
  if (!event.dateRange?.from) return "Date TBA";
  const date = new Date(event.dateRange.from);
  if (isNaN(date.getTime())) return "Date TBA";

  let str = format(date, "EEE do MMM yyyy");
  if (event.startTime) {
    try {
      str += `, ${format(parse(event.startTime, "HH:mm", new Date()), "h:mm aa")}`;
    } catch {
      // ignore malformed time strings
    }
  }
  return str;
}

const money = (n: number) => `$${(n || 0).toFixed(2)}`;

type TabKey =
  | "overview"
  | "orders"
  | "attendees"
  | "scanning"
  | "verify"
  | "analytics";

type NavItem = { key: TabKey; label: string };
type NavSection = { title: string; icon: React.ElementType; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    title: "Orders/Refunds",
    icon: Receipt,
    items: [{ key: "orders", label: "Orders" }],
  },
  {
    title: "Manage attendees",
    icon: Users,
    items: [
      { key: "attendees", label: "Attendees" },
      { key: "scanning", label: "Scanning count" },
    ],
  },
  {
    title: "Reports",
    icon: BarChart3,
    items: [{ key: "analytics", label: "Analytics" }],
  },
];

export default function ManageEventPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: eventData, isLoading: eventLoading } = useGetSingleForForm(id);
  const { data: attendeeData, isLoading: attendeesLoading } =
    useGetEventVerifyUsers(id);
  const { data: purchaseData, isLoading: purchasesLoading } =
    useGetEventTicketPurchase(id);
  // const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();
  const { mutate: setTicketStatus, isPending: isChangingStatus } =
    useSetTicketStatus();
  const { mutate: sendInvoice } = useSendInvoice();

  const [tab, setTab] = useState<TabKey>("overview");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    "Orders/Refunds": true,
    "Manage attendees": true,
    Reports: true,
  });
  const [orderSearch, setOrderSearch] = useState("");
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [viewInvoice, setViewInvoice] = useState<any | null>(null);
  const [sendingInvoiceId, setSendingInvoiceId] = useState<string | null>(null);
  // Ticket QR codes have to actually be painted to a <canvas> before we can
  // read them back out as an image for the PDF — there's no headless QR
  // encoder in this project — so downloading tickets from a table row (no
  // permanently-visible QR carousel like the ticket detail pages have)
  // briefly mounts them off-screen, captures each canvas, then unmounts.
  const [ticketsToRender, setTicketsToRender] = useState<any | null>(null);
  const [downloadingTicketsId, setDownloadingTicketsId] = useState<
    string | null
  >(null);
  const ticketCanvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    row: any;
    status: "verified" | "pending";
  } | null>(null);

  const event: EventType | undefined = eventData?.data;
  const rows: any[] = useMemo(() => attendeeData?.data || [], [attendeeData]);
  const purchases: any[] = useMemo(
    () => purchaseData?.data || [],
    [purchaseData],
  );

  const isPaid = event?.price_category === "paid";
  const isExternal = event?.price_category === "external";
  const capacityTotal = useMemo(
    () => (event?.options || []).reduce((sum, o) => sum + (o.capacity || 0), 0),
    [event],
  );
  const soldTotal = useMemo(
    () => (event?.options || []).reduce((sum, o) => sum + (o.sold || 0), 0),
    [event],
  );
  const scannedCount = rows.filter((r) => r.status === "verified").length;
  const notScannedCount = rows.length - scannedCount;

  const earnings = useMemo(() => {
    return purchases.reduce(
      (acc, p) => ({
        ticketTotal: acc.ticketTotal + (p.ticketTotal || 0),
        serviceFee: acc.serviceFee + (p.serviceFee || 0),
        surcharge: acc.surcharge + (p.surcharge || 0),
        totalAmount: acc.totalAmount + (p.totalAmount || 0),
      }),
      { ticketTotal: 0, serviceFee: 0, surcharge: 0, totalAmount: 0 },
    );
  }, [purchases]);

  const scanningByType = useMemo(() => {
    const map: Record<string, { total: number; scanned: number }> = {};
    rows.forEach((r) => {
      const type = r.ticketType || "General";
      if (!map[type]) map[type] = { total: 0, scanned: 0 };
      map[type].total += 1;
      if (r.status === "verified") map[type].scanned += 1;
    });
    return Object.entries(map);
  }, [rows]);

  const optionRevenue = useMemo(() => {
    const map: Record<string, number> = {};
    purchases.forEach((p: any) => {
      (p.items || []).forEach((item: any) => {
        map[item.optionName] =
          (map[item.optionName] || 0) + item.unitPrice * item.quantity;
      });
    });
    return map;
  }, [purchases]);

  const filteredPurchases = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    if (!q) return purchases;
    return purchases.filter(
      (p: any) =>
        p.invoiceNumber?.toLowerCase().includes(q) ||
        p.user?.name?.toLowerCase().includes(q) ||
        p.user?.email?.toLowerCase().includes(q),
    );
  }, [purchases, orderSearch]);

  const filteredRows = useMemo(() => {
    const q = attendeeSearch.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r: any) => r.user?.name?.toLowerCase().includes(q));
  }, [rows, attendeeSearch]);

  console.log(
    "ManageEventPage render",
    filteredPurchases.length,
    filteredRows.reduce((acc, r) => acc + (r.status === "verified" ? 1 : 0), 0),
  );
  const handleCopyUrl = () => {
    if (!event?.slug)
      return toast.error("This event doesn't have a public link yet");
    const url = `${window.location.origin}/events/${event.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Event URL copied to clipboard");
  };

  // const handleDelete = () => {
  //   deleteEvent(
  //     { id },
  //     {
  //       onSuccess: () => {
  //         toast.success("Event deleted successfully");
  //         queryClient.invalidateQueries({ queryKey: ["event"] });
  //         router.push("/dashboard/events");
  //       },
  //     },
  //   );
  // };

  const handlePrintInvoice = (p: any) => {
    const win = window.open("", "_blank");
    if (!win) return;

    const itemsHtml = (p.items || [])
      .map(
        (i: any) =>
          `<tr><td style="padding:8px 0;">${i.optionName} × ${i.quantity}</td><td style="padding:8px 0;text-align:right;">$${(i.unitPrice * i.quantity).toFixed(2)}</td></tr>`,
      )
      .join("");

    win.document.write(`
      <html>
        <head>
          <title>Invoice ${p.invoiceNumber}</title>
          <style>
            body { font-family: sans-serif; color: #333; padding: 40px; }
            h1 { color: #051e3a; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            td { padding: 8px 0; }
            .total { font-weight: bold; border-top: 2px solid #051e3a; }
          </style>
        </head>
        <body>
          <h1>Invoice</h1>
          <p>${event?.title || ""}</p>
          <p>Buyer: ${p.user?.name || p.user?.email || "N/A"}</p>
          <p>Invoice #: ${p.invoiceNumber}</p>
          <p>Date: ${p.createdAt ? format(new Date(p.createdAt), "dd MMM yyyy") : ""}</p>
          <table>
            ${itemsHtml}
            <tr><td>Service fee</td><td style="text-align:right;">$${(p.serviceFee || 0).toFixed(2)}</td></tr>
            <tr><td>Surcharge</td><td style="text-align:right;">$${(p.surcharge || 0).toFixed(2)}</td></tr>
            <tr class="total"><td>Total</td><td style="text-align:right;">$${(p.totalAmount || 0).toFixed(2)}</td></tr>
          </table>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  const loadLogo = (): Promise<HTMLImageElement | null> =>
    new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = "/wha/logo.png";
    });

  const handleDownloadTickets = (p: any) => {
    ticketCanvasRefs.current.clear();
    setDownloadingTicketsId(p._id);
    setTicketsToRender(p);
  };

  // Runs once the hidden QR canvases for `ticketsToRender` have painted,
  // reads them back out as images, builds the PDF, then tears the hidden
  // canvases back down.
  useEffect(() => {
    if (!ticketsToRender) return;
    const timer = setTimeout(async () => {
      const p = ticketsToRender;
      try {
        const title = getTicketTitle(p);
        const venue = getTicketVenue(p);
        const dateRange = getTicketDateRange(p);
        const codes = getTicketCodes(p);
        const holderName = p.user?.name || p.user?.email || "Ticket Holder";
        const logo = await loadLogo();

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
            doc.text(
              new Date(dateRange.from).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "short",
                year: "numeric",
              }),
              50,
              y,
              { align: "center" },
            );
            y += 5;
          }
          if (venue) {
            doc.text(venue, 50, y, { align: "center", maxWidth: 90 });
            y += 5;
          }

          const canvas = ticketCanvasRefs.current.get(code.key);
          if (canvas) {
            doc.addImage(
              canvas.toDataURL("image/png"),
              "PNG",
              20,
              y + 5,
              60,
              60,
            );
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
          doc.setFont("courier", "normal");
          doc.setFontSize(7);
          doc.text(code.key, 50, qrBottom + 17, { align: "center" });
        });

        doc.save(
          `${(title || "event").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-tickets-${p.invoiceNumber || p._id}.pdf`,
        );
      } catch {
        toast.error("Couldn't download tickets");
      } finally {
        setTicketsToRender(null);
        setDownloadingTicketsId(null);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [ticketsToRender]);

  const handleSendInvoice = (p: any) => {
    setSendingInvoiceId(p._id);
    sendInvoice(
      { purchaseId: p._id },
      {
        onSuccess: () => {
          toast.success("Invoice sent to buyer");
          setSendingInvoiceId(null);
        },
        onError: (error: any) => {
          toast.error(error.message || "Failed to send invoice");
          setSendingInvoiceId(null);
        },
      },
    );
  };

  const handleRequestStatusChange = (
    row: any,
    status: "verified" | "pending",
  ) => {
    if (row.status === status) return;
    setPendingStatusChange({ row, status });
  };

  const handleConfirmStatusChange = () => {
    if (!pendingStatusChange) return;
    const { row, status } = pendingStatusChange;
    setTicketStatus(
      { uniqueKey: row.uniqueKey, status },
      {
        onSuccess: () => {
          toast.success(
            `Status updated to ${status === "verified" ? "Checked In" : "Pending"}`,
          );
          queryClient.invalidateQueries({ queryKey: ["verify-users", id] });
          queryClient.invalidateQueries({
            queryKey: ["ticket-purchase-business"],
          });
          queryClient.invalidateQueries({ queryKey: ["redeem-business"] });
          setPendingStatusChange(null);
        },
        onError: (error: any) => {
          toast.error(error.message || "Failed to update status");
          setPendingStatusChange(null);
        },
      },
    );
  };

  const toggleSection = (title: string) =>
    setOpenSections((s) => ({ ...s, [title]: !s[title] }));

  if (eventLoading || !event) {
    return (
      <div className="p-10 text-center text-gray-400">Loading event...</div>
    );
  }

  const status = getEventStatus(event);

  return (
    <div className="flex flex-col lg:flex-row gap-5 p-4 lg:p-6">
      {/* ── Sidebar nav ── */}
      <aside className="lg:w-64 shrink-0">
        <div className="lg:sticky lg:top-6 bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-100">
            <Settings className="h-4 w-4 text-primary" />
            <span className="font-bold text-primary">Manage event</span>
          </div>

          <nav className="p-2 space-y-1">
            <button
              onClick={() => setTab("overview")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "overview"
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-50"
              }`}>
              <LayoutDashboard className="h-4 w-4" /> Overview
            </button>

            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                  <span className="flex items-center gap-2">
                    <section.icon className="h-4 w-4" /> {section.title}
                  </span>
                  {openSections[section.title] ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
                {openSections[section.title] && (
                  <div className="pl-9 space-y-0.5">
                    {section.items.map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setTab(item.key)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          tab === item.key
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-gray-500 hover:bg-gray-50"
                        }`}>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => setTab("verify")}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "verify"
                  ? "bg-primary/10 text-primary"
                  : "text-gray-600 hover:bg-gray-50"
              }`}>
              <QrCode className="h-4 w-4" /> Verify Tickets
            </button>
          </nav>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="size-14 rounded-full border border-gray-100 shrink-0">
              <AvatarImage
                src={event.image}
                alt={event.title}
                className="object-cover"
              />
              <AvatarFallback>{event.title?.[0] ?? "E"}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Badge
                variant="secondary"
                className={`mb-1 ${STATUS_STYLES[status].className}`}>
                {STATUS_STYLES[status].label}
              </Badge>
              <h1 className="text-lg font-bold text-primary truncate">
                {event.title}
              </h1>
              <p className="text-sm text-gray-400 truncate">
                {formatEventDateTime(event)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {event.slug && (
              <a
                href={`/events/${event.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-primary border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
                <ExternalLink size={14} /> Preview
              </a>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                  <MoreVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyUrl}>
                  <Link2 className="h-4 w-4" /> Copy URL
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    router.push(`/dashboard/events/add-event?id=${id}`)
                  }>
                  <Settings className="h-4 w-4" /> Edit event
                </DropdownMenuItem>
                {/* <DeleteConfirmDialog
                  onConfirm={handleDelete}
                  text={event.title}
                  isPending={isDeleting}
                  header={
                    <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-sm cursor-pointer">
                      <Trash2 className="h-4 w-4" /> Delete event
                    </div>
                  }
                /> */}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Tab content */}
        {tab === "overview" && (
          <div className="space-y-5">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <h2 className="font-bold text-primary">Share event</h2>
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2">
                <span className="text-sm text-gray-500 truncate flex-1">
                  {event.slug
                    ? `${typeof window !== "undefined" ? window.location.origin : ""}/events/${event.slug}`
                    : "No public link yet"}
                </span>
                <button
                  onClick={handleCopyUrl}
                  className="text-primary hover:bg-primary/10 rounded-md p-1.5 transition-colors">
                  <Copy size={15} />
                </button>
              </div>
            </div>

            {isPaid ? (
              <>
                <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
                  <h2 className="font-bold text-primary">
                    Total Amount: {money(earnings.totalAmount)}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-400">Capacity</p>
                      <p className="text-xl font-bold text-primary">
                        {soldTotal}/{capacityTotal || "∞"}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-400">Tickets Sold</p>
                      <p className="text-xl font-bold text-primary">
                        {soldTotal}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-xs text-gray-400">Orders</p>
                      <p className="text-xl font-bold text-primary">
                        {purchases.length}
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100 border-t border-gray-100 pt-2">
                    {[
                      ["Your Earnings", earnings.ticketTotal],
                      ["Service fee", earnings.serviceFee],
                      ["Surcharge", earnings.surcharge],
                    ].map(([label, val]) => (
                      <div
                        key={label as string}
                        className="flex justify-between py-2 text-sm">
                        <span className="text-gray-500">{label}</span>
                        <span className="font-medium text-primary">
                          {money(val as number)}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 text-sm font-bold">
                      <span className="text-primary">Total Amount</span>
                      <span className="text-primary">
                        {money(earnings.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
                  <h2 className="font-bold text-primary">
                    Earnings by Ticket Type
                  </h2>
                  {Object.keys(optionRevenue).length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {Object.entries(optionRevenue).map(([name, amount]) => (
                        <div
                          key={name}
                          className="flex justify-between py-2 text-sm">
                          <span className="text-gray-600">{name}</span>
                          <span className="font-semibold text-primary">
                            {money(amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">
                      No sales yet for any ticket type.
                    </p>
                  )}
                </div>
              </>
            ) : isExternal ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h2 className="font-bold text-primary mb-3">
                  External Ticketing
                </h2>
                <p className="text-sm text-gray-500">
                  Tickets for this event are sold on a third-party site — WHA
                  does not track sales or earnings for it.
                </p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <h2 className="font-bold text-primary mb-3">Registrations</h2>
                <p className="text-3xl font-bold text-primary">{rows.length}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Free event — no earnings to track.
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "orders" && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-bold text-primary">Orders</h2>
              <div className="relative w-full sm:w-64">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search invoice or buyer"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary/40"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Buyer Email</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchasesLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-24 text-center text-gray-400">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredPurchases.length > 0 ? (
                    filteredPurchases.map((p: any) => (
                      <TableRow key={p._id}>
                        <TableCell className="font-mono text-xs">
                          {p.invoiceNumber}
                        </TableCell>
                        <TableCell className="font-medium">
                          {p.user?.name || p.user?.email || "N/A"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {p.user?.email}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {(p.items || [])
                            .map((i: any) => `${i.quantity}x ${i.optionName}`)
                            .join(", ")}
                        </TableCell>
                        <TableCell className="font-semibold text-primary">
                          {money(p.totalAmount)}
                        </TableCell>
                        <TableCell>
                          {p.status === "verified" ? (
                            <Badge className="bg-green-50 text-green-700 border-green-100">
                              Checked In
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-slate-50 text-slate-500 border-slate-100">
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-400">
                          {p.createdAt
                            ? format(
                                new Date(p.createdAt),
                                "dd MMM yyyy h:mm aa",
                              )
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="flex items-center justify-center h-8 w-8 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors ml-auto">
                                <MoreVertical size={15} />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setViewInvoice(p)}>
                                <Eye className="h-4 w-4" /> View Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handlePrintInvoice(p)}>
                                <Printer className="h-4 w-4" /> Print Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={sendingInvoiceId === p._id}
                                onClick={() => handleSendInvoice(p)}>
                                {sendingInvoiceId === p._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Send className="h-4 w-4" />
                                )}
                                Send Invoice
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                disabled={downloadingTicketsId === p._id}
                                onClick={() => handleDownloadTickets(p)}>
                                {downloadingTicketsId === p._id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Download className="h-4 w-4" />
                                )}
                                Download Tickets
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-24 text-center text-gray-400">
                        {orderSearch
                          ? "No orders match your search."
                          : "No orders yet."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {tab === "attendees" && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
              <h2 className="font-bold text-primary">
                Attendees
                <p className="text-xs text-gray-400">
                  checked-In :
                  {filteredRows.reduce(
                    (acc, r) => acc + (r.status === "verified" ? 1 : 0),
                    0,
                  )}
                  / {rows.length}
                </p>
              </h2>
              <div className="relative w-full sm:w-64">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  placeholder="Search by name"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:border-primary/40"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Ticket Type</TableHead>
                    <TableHead>Unique Key</TableHead>
                    <TableHead>Checked In</TableHead>
                    <TableHead className="text-right">
                      Checked In Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendeesLoading ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-gray-400">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredRows.length > 0 ? (
                    filteredRows.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">
                          {item.user?.name || "N/A"}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {item.ticketType || "General"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {item.uniqueKey}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="inline-flex">
                                {item.status === "verified" ? (
                                  <Badge className="bg-green-50 text-green-700 border-green-100 gap-1 cursor-pointer">
                                    <CheckCircle2 className="h-3 w-3" /> Checked
                                    In
                                    <ChevronDown className="h-3 w-3" />
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="secondary"
                                    className="bg-slate-50 text-slate-500 border-slate-100 gap-1 cursor-pointer">
                                    <CircleDashed className="h-3 w-3" /> Not
                                    Checked In yet
                                    <ChevronDown className="h-3 w-3" />
                                  </Badge>
                                )}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRequestStatusChange(item, "verified")
                                }>
                                <CheckCircle2 className="h-4 w-4 text-green-600" />{" "}
                                Mark Checked In
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRequestStatusChange(item, "pending")
                                }>
                                <CircleDashed className="h-4 w-4 text-slate-500" />{" "}
                                Mark Pending
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="text-right text-sm text-gray-400">
                          {item.verifiedAt
                            ? format(
                                new Date(item.verifiedAt),
                                "dd MMM yyyy h:mm aa",
                              )
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="h-24 text-center text-gray-400">
                        {attendeeSearch
                          ? "No attendees match your search."
                          : "No ticket holders yet."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {tab === "scanning" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400">Total Tickets</p>
                <p className="text-2xl font-bold text-primary">{rows.length}</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400">Checked In</p>
                <p className="text-2xl font-bold text-green-600">
                  {scannedCount}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-4 text-center">
                <p className="text-xs text-gray-400">Not Checked In Yet</p>
                <p className="text-2xl font-bold text-slate-500">
                  {notScannedCount}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h2 className="font-bold text-primary">By ticket type</h2>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket Type</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Checked In</TableHead>
                      <TableHead className="text-right">Remaining</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scanningByType.length > 0 ? (
                      scanningByType.map(([type, stats]) => (
                        <TableRow key={type}>
                          <TableCell className="font-medium">{type}</TableCell>
                          <TableCell className="text-center">
                            {stats.total}
                          </TableCell>
                          <TableCell className="text-center text-green-600 font-semibold">
                            {stats.scanned}
                          </TableCell>
                          <TableCell className="text-right text-gray-400">
                            {stats.total - stats.scanned}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="h-24 text-center text-gray-400">
                          No tickets yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {tab === "verify" && (
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <h2 className="font-bold text-primary mb-1">Verify Tickets</h2>
            <p className="text-sm text-gray-400 mb-4">
              Only tickets purchased or registered for this event will be
              accepted.
            </p>
            <VerifyEventPage eventId={id} hideHeader />
          </div>
        )}

        {tab === "analytics" && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-bold text-primary">Analytics</h2>
            </div>
            {isPaid ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ticket Type</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-center">Capacity</TableHead>
                      <TableHead className="text-center">Sold</TableHead>
                      <TableHead className="text-center">Remaining</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(event.options || []).length > 0 ? (
                      (event.options || []).map((o) => (
                        <TableRow key={o._id}>
                          <TableCell className="font-medium">
                            {o.name}
                          </TableCell>
                          <TableCell className="text-right">
                            {money(o.price || 0)}
                          </TableCell>
                          <TableCell className="text-center">
                            {o.capacity ?? "∞"}
                          </TableCell>
                          <TableCell className="text-center">
                            {o.sold || 0}
                          </TableCell>
                          <TableCell className="text-center text-gray-400">
                            {o.capacity != null
                              ? o.capacity - (o.sold || 0)
                              : "∞"}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-primary">
                            {money(optionRevenue[o.name || ""] || 0)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="h-24 text-center text-gray-400">
                          No ticket types configured.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : isExternal ? (
              <div className="p-5">
                <p className="text-sm text-gray-500">
                  External ticketing events do not have in-app analytics.
                </p>
              </div>
            ) : (
              <div className="p-5">
                <p className="text-sm text-gray-500">
                  Total registrations:{" "}
                  <span className="font-bold text-primary">{rows.length}</span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Off-screen QR codes for the ticket currently being downloaded — see
          the effect above for why these have to actually mount before a PDF
          can be built from them. */}
      {ticketsToRender && (
        <div
          style={{ position: "fixed", left: -9999, top: 0 }}
          aria-hidden="true">
          {getTicketCodes(ticketsToRender).map((code) => (
            <QRCodeCanvas
              key={code.key}
              value={code.key}
              size={200}
              level="H"
              ref={(el) => {
                if (el) ticketCanvasRefs.current.set(code.key, el);
              }}
            />
          ))}
        </div>
      )}

      {/* View invoice dialog */}
      <Dialog
        open={!!viewInvoice}
        onOpenChange={(open) => !open && setViewInvoice(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invoice {viewInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Buyer</span>
                <span className="font-medium text-gray-800">
                  {viewInvoice.user?.name || viewInvoice.user?.email || "N/A"}
                </span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Date</span>
                <span className="font-medium text-gray-800">
                  {viewInvoice.createdAt
                    ? format(new Date(viewInvoice.createdAt), "dd MMM yyyy")
                    : "-"}
                </span>
              </div>

              <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
                {(viewInvoice.items || []).map((i: any) => (
                  <div key={i.optionName} className="flex justify-between py-2">
                    <span className="text-gray-600">
                      {i.optionName} × {i.quantity}
                    </span>
                    <span className="font-medium text-gray-800">
                      {money(i.unitPrice * i.quantity)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Service fee</span>
                  <span className="font-medium text-gray-800">
                    {money(viewInvoice.serviceFee)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Surcharge</span>
                  <span className="font-medium text-gray-800">
                    {money(viewInvoice.surcharge)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between font-bold text-primary">
                <span>Total</span>
                <span>{money(viewInvoice.totalAmount)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm status change dialog */}
      <AlertDialog
        open={!!pendingStatusChange}
        onOpenChange={(open) => !open && setPendingStatusChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change ticket status?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change status of{" "}
              <strong>
                {pendingStatusChange?.row.user?.name || "this buyer"}
              </strong>{" "}
              to{" "}
              <strong>
                {pendingStatusChange?.status === "verified"
                  ? "Checked In"
                  : "Pending"}
              </strong>
              ?
              {pendingStatusChange?.status === "pending" && (
                <> Their checked-in date will be removed.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isChangingStatus}
              onClick={handleConfirmStatusChange}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
