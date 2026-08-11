"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useGetTickets } from "@/services/dashboard.service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  MapPin,
  QrCode,
  Ticket as TicketIcon,
  AlertCircle,
} from "lucide-react";
import {
  getTicketTitle,
  getTicketImage,
  getTicketVenue,
  getTicketDateRange,
  getTicketCodes,
  isEventItem,
  isTicketPast,
  sortPendingFirst,
  formatDateLong,
  formatTime,
} from "./ticket-utils";
import { format, parse } from "date-fns";

const STATUS_BADGE: Record<string, string> = {
  verified: "badge-success",
  pending: "badge-warning",
};

const TicketRow = ({ item, onClick }: { item: any; onClick: () => void }) => {
  const isEvent = isEventItem(item);
  const title = getTicketTitle(item);
  const image = getTicketImage(item);
  const venue = getTicketVenue(item);
  const dateRange = getTicketDateRange(item);
  const codes = getTicketCodes(item);
  const badgeClass = STATUS_BADGE[item.status] ?? "badge-secondary";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-2xl">
      <div className="card rounded-2xl p-4 flex flex-col gap-3 group-hover:shadow-md group-active:scale-[0.99] transition-all">
        <div className="flex items-start justify-between gap-3">
          <div>
            {dateRange ? (
              <>
                <p className="text-sm font-extrabold text-primary">
                  {new Date(dateRange.from).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {item.event.startTime &&
                    format(
                      parse(item.event.startTime, "HH:mm", new Date()),
                      "h:mm aa",
                    )}{" "}
                  -{" "}
                  {item.event.startTime &&
                    format(
                      parse(item.event.endTime, "HH:mm", new Date()),
                      "h:mm aa",
                    )}
                </p>
              </>
            ) : (
              item?.deal?.valid_till && (
                <p className="text-sm font-extrabold text-primary">
                  Valid till {formatDateLong(item.deal.valid_till)}
                </p>
              )
            )}
          </div>
          <div className="flex items-center gap-1 text-primary shrink-0 font-bold text-lg">
            {codes.length}
            <QrCode className="h-4 w-4 text-secondary" />
          </div>
        </div>

        <div className="flex items-center gap-3">
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
            <h3 className="font-bold text-foreground text-sm line-clamp-1">
              {title}
            </h3>
            {venue && (
              <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                {/* <MapPin className="h-3 w-3 shrink-0 text-secondary" /> */}
                {venue}
              </p>
            )}
          </div>
        </div>

        {/* <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className={`badge ${badgeClass} capitalize`}>
            {isEvent ? "Event" : "Deal"} · {item.status}
          </span>
          <span className="text-xs font-semibold text-muted-foreground group-hover:text-secondary transition-colors">
            View ticket &rarr;
          </span>
        </div> */}
      </div>
    </button>
  );
};

const ListSkeleton = () => (
  <div className="flex flex-col gap-3">
    {[1, 2, 3].map((i) => (
      <Skeleton key={i} className="h-[140px] w-full rounded-2xl" />
    ))}
  </div>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="border border-dashed border-border rounded-2xl py-14 px-6 text-center">
    <TicketIcon className="h-9 w-9 text-muted-foreground/40 mx-auto mb-3" />
    <p className="text-sm font-semibold text-muted-foreground">{label}</p>
  </div>
);

const ErrorState = ({ onRetry }: { onRetry: () => void }) => (
  <div className="border border-dashed border-destructive/30 rounded-2xl py-14 px-6 text-center">
    <AlertCircle className="h-9 w-9 text-destructive/60 mx-auto mb-3" />
    <p className="text-sm font-semibold text-muted-foreground mb-3">
      Couldn&apos;t load your tickets.
    </p>
    <Button variant="outline" size="sm" onClick={onRetry}>
      Try again
    </Button>
  </div>
);

const TicketList = ({
  tickets,
  isLoading,
  isError,
  onRetry,
  onSelect,
  emptyLabel,
}: {
  tickets: any[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelect: (id: string) => void;
  emptyLabel: string;
}) => {
  if (isLoading) return <ListSkeleton />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (tickets.length === 0) return <EmptyState label={emptyLabel} />;

  return (
    <div className="flex flex-col gap-3">
      {tickets.map((item) => (
        <TicketRow
          key={item._id}
          item={item}
          onClick={() => onSelect(item._id)}
        />
      ))}
    </div>
  );
};

const Ticket = ({ hideHeader = false }: { hideHeader?: boolean }) => {
  const { data, isLoading, isError, refetch } = useGetTickets();
  const tickets: any[] = data?.data || [];
  const router = useRouter();

  const upcomingTickets = sortPendingFirst(
    tickets.filter((t) => !isTicketPast(t)),
  );
  const pastTickets = tickets.filter((t) => isTicketPast(t));

  const goToTicket = (id: string) => router.push(`/activity/tickets/${id}`);

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

      <Tabs defaultValue="upcoming" className="gap-4">
        <TabsList
          variant="default"
          className="!h-auto !w-full !gap-1 !rounded-xl !border-none !bg-muted !p-1">
          <TabsTrigger
            value="upcoming"
            className="!h-auto flex-1 !rounded-lg !border-none !bg-transparent !px-0 !py-2.5 text-sm font-bold !text-muted-foreground !shadow-none after:!hidden data-[state=active]:!bg-background data-[state=active]:!text-foreground data-[state=active]:!shadow-sm">
            Upcoming{" "}
            <span className="font-normal text-xs text-muted-foreground/70">
              ({upcomingTickets.length})
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="!h-auto flex-1 !rounded-lg !border-none !bg-transparent !px-0 !py-2.5 text-sm font-bold !text-muted-foreground !shadow-none after:!hidden data-[state=active]:!bg-background data-[state=active]:!text-foreground data-[state=active]:!shadow-sm">
            Past{" "}
            <span className="font-normal text-xs text-muted-foreground/70">
              ({pastTickets.length})
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <TicketList
            tickets={upcomingTickets}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onSelect={goToTicket}
            emptyLabel="No upcoming tickets"
          />
        </TabsContent>

        <TabsContent value="past">
          <TicketList
            tickets={pastTickets}
            isLoading={isLoading}
            isError={isError}
            onRetry={refetch}
            onSelect={goToTicket}
            emptyLabel="No past tickets"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Ticket;
