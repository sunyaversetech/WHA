"use client";
import { useState } from "react";
import { useGetTickets } from "@/services/dashboard.service";
import { QRCodeCanvas } from "qrcode.react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  CalendarDays,
  ChevronLeft,
  MapPin,
  Tag,
  Ticket as TicketIcon,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const QRDialog = ({
  open,
  onClose,
  item,
}: {
  open: boolean;
  onClose: () => void;
  item: any;
}) => {
  const isEvent = !!item?.event;
  const title = item?.event?.title ?? item?.deal?.title ?? "Ticket";

  const keys =
    item.uniqueKeys && item.uniqueKeys.length > 0
      ? item.uniqueKeys
      : [item.uniqueKey];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-xs w-full rounded-2xl p-0 overflow-hidden border-none shadow-2xl bg-gradient-to-b from-[#1a1a2e] to-[#0f3460] text-white">
        <div className="px-6 pt-6 pb-4 border-b border-white/10 text-center">
          <div className="flex items-center justify-center mb-2">
            {isEvent ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
                <TicketIcon className="w-3 h-3" /> Event Pass
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300">
                <Tag className="w-3 h-3" /> Deal Voucher
              </span>
            )}
          </div>
          <DialogTitle className="text-base font-bold leading-snug">
            {title}
          </DialogTitle>
        </div>

        <div className="px-6 py-8">
          {keys.length > 1 ? (
            <Carousel className="w-full max-w-[200px] mx-auto">
              <CarouselContent>
                {keys.map((key: string, index: number) => (
                  <CarouselItem
                    key={index}
                    className="flex flex-col items-center gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-xl">
                      <QRCodeCanvas value={key} size={160} level="H" />
                    </div>
                    <div className="text-center space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                        Code {index + 1} of {keys.length}
                      </p>
                      <p className="text-xs font-mono font-bold text-white/80">
                        {key}
                      </p>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="-left-8 bg-white/10 border-none hover:bg-white/20" />
              <CarouselNext className="-right-8 bg-white/10 border-none hover:bg-white/20" />
            </Carousel>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-xl">
                <QRCodeCanvas value={keys[0]} size={160} level="H" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Unique Code
                </p>
                <p className="text-sm font-mono font-bold tracking-widest text-white/80 break-all">
                  {keys[0]}
                </p>
              </div>
            </div>
          )}

          {!isEvent && (
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400 italic text-center mt-6">
              Show this at checkout to redeem
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const TicketCard = ({ item, onClick }: { item: any; onClick: () => void }) => {
  const isEvent = !!item.event;
  const { status } = item;
  const title = isEvent
    ? item.event?.title
    : item.deal?.title || "Limited Deal";

  const statusColor =
    status === "verified"
      ? "bg-emerald-500 text-white"
      : status === "pending"
        ? "bg-amber-500 text-white"
        : "bg-blue-500 text-white";

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      className="relative cursor-pointer w-full overflow-hidden rounded-2xl shadow-xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white  hover:border-indigo-400/40 hover:shadow-indigo-900/40 transition-all duration-200 active:scale-[0.98]">
      <span className="absolute top-[45%] -left-1 -translate-x-1/2 w-6 h-6 rounded-full bg-background border border-white/10 z-10" />
      <span className="absolute top-[45%] -right-7 -translate-x-1/2 w-6 h-6 rounded-full bg-background border border-white/10 z-10" />

      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {isEvent ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300">
              <TicketIcon className="w-3 h-3" /> Event
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300">
              <Tag className="w-3 h-3" /> Deal
            </span>
          )}
          <span
            className={`text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full ${statusColor}`}>
            {status}
          </span>
        </div>

        <h3 className="text-lg font-extrabold leading-snug tracking-tight line-clamp-2">
          {title}
        </h3>

        {isEvent ? (
          <div className="space-y-1.5 text-slate-300 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>
                {new Date(item.event.dateRange.from).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 shrink-0 text-rose-400" />
              <span className="truncate">{item?.event?.venue}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 text-slate-300 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 shrink-0 text-indigo-400" />
              <span>
                {item?.deal?.valid_till &&
                  new Date(item.deal.valid_till).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        <p className="text-[10px] text-white/30 font-medium tracking-wide mt-1">
          {isEvent ? "Tap to view QR pass" : "Tap to view voucher"}
        </p>
      </div>
    </div>
  );
};

const DesktopGrid = ({
  tickets,
  onCardClick,
}: {
  tickets: any[];
  onCardClick: (item: any) => void;
}) => {
  if (tickets.length === 0) return <EmptyState />;
  return (
    <div className="grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {tickets.map((item: any) => (
        <TicketCard
          key={item._id}
          item={item}
          onClick={() => onCardClick(item)}
        />
      ))}
    </div>
  );
};

const EmptyState = () => (
  <div className="text-center py-16 text-muted-foreground text-sm">
    No tickets to show here.
  </div>
);

const sortPendingFirst = (arr: any[]) =>
  [...arr].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return 0;
  });

const Ticket = ({ hideHeader = false }: { hideHeader?: boolean }) => {
  const { data } = useGetTickets();
  const tickets: any[] = data?.data || [];

  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  const now = new Date();

  const upcomingTickets = sortPendingFirst(
    tickets.filter((t) => {
      if (t.event) return new Date(t.event.dateRange.from) >= now;
      return true;
    }),
  );

  const router = useRouter();
  const pastTickets = tickets.filter(
    (t) => t.event && new Date(t.event.dateRange.from) < now,
  );

  return (
    <div className={hideHeader ? "" : "p-6 min-h-screen"}>
      {!hideHeader && (
        <>
          <Button variant={"ghost"} onClick={() => router.back()}>
            <ChevronLeft />
          </Button>
          <div className="mb-8">
            <h1 className="text-4xl font-extrabold tracking-tight">Wallet</h1>
            <p className="text-muted-foreground mt-1">
              Your event passes and exclusive rewards.
            </p>
          </div>
        </>
      )}

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full">
          <TabsTrigger value="upcoming" className="w-full">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="past" className="w-full">
            Past
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <DesktopGrid
            tickets={upcomingTickets}
            onCardClick={setSelectedTicket}
          />
        </TabsContent>

        <TabsContent value="past">
          <div className="">
            <DesktopGrid
              tickets={pastTickets}
              onCardClick={setSelectedTicket}
            />
          </div>
        </TabsContent>
      </Tabs>
      {selectedTicket && (
        <QRDialog
          open={!!selectedTicket}
          onClose={() => setSelectedTicket(null)}
          item={selectedTicket}
        />
      )}
    </div>
  );
};

export default Ticket;
