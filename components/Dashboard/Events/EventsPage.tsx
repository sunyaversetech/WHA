"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PlusCircle,
  ShieldCheck,
  ExternalLink,
  Search,
  Eye,
  Edit,
  Link2,
  MoreVertical,
  Trash2,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { format, parse } from "date-fns";
import {
  EventType,
  // useDeleteEvent,
  useGetEvent,
  useArchiveEvent,
} from "@/services/event.service";
import Link from "next/link";
// import { DeleteConfirmDialog } from "@/components/ui/DynamicDeleteButton";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import "@/app/globals.css";

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

function getTicketsTakenCount(event: EventType): number {
  if (event.price_category === "paid") {
    return (event.options || []).reduce((sum, o) => sum + (o.sold || 0), 0);
  }
  if (event.price_category === "registration") {
    return event.registration_sold || 0;
  }
  return 0;
}

function parseErrorMessage(error: any, fallback: string): string {
  try {
    const parsed = JSON.parse(error?.message);
    return parsed?.error || parsed?.message || fallback;
  } catch {
    return error?.message || fallback;
  }
}

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

// function formatEventPrice(event: EventType): string {
//   if (event.price_category === "paid") {
//     const price = event.options?.[0]?.price;
//     return price ? `$${price}` : "Paid";
//   }
//   if (event.price_category === "external") return "External";
//   return "Free";
// }

// const STATUS_STYLES: Record<EventStatus, { label: string; className: string }> =
//   {
//     upcoming: {
//       label: "Upcoming",
//       className: "bg-primary/10 text-primary border-primary/20",
//     },
//     live: {
//       label: "Live",
//       className: "bg-green-50 text-green-700 border-green-100",
//     },
//     past: {
//       label: "Past",
//       className: "bg-slate-100 text-slate-500 border-slate-200",
//     },
//   };

const FILTERS: { key: EventStatus; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "live", label: "Live" },
  { key: "past", label: "Past" },
  { key: "archived", label: "Archived" },
];

export default function EventsBackend() {
  const { data, isLoading } = useGetEvent();
  const [activeTab, setActiveTab] = useState<EventStatus>("upcoming");
  const [search, setSearch] = useState("");
  const { mutate: archiveEvent } = useArchiveEvent();
  // const { mutate, isPending } = useDeleteEvent();
  const queryClient = useQueryClient();
  const router = useRouter();

  const allEvents = useMemo(() => data?.data || [], [data]);

  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();

    return allEvents
      .filter((event) => getEventStatus(event) === activeTab)
      .filter((event) => !q || event.title?.toLowerCase().includes(q))
      .sort((a, b) => {
        const dateA = new Date(a.dateRange?.from ?? "").getTime();
        const dateB = new Date(b.dateRange?.from ?? "").getTime();

        return activeTab === "past" ? dateB - dateA : dateA - dateB;
      });
  }, [allEvents, activeTab, search]);

  // const recentlyUpdated = useMemo(() => {
  //   return [...allEvents]
  //     .filter((event) => event.updatedAt)
  //     .sort(
  //       (a, b) =>
  //         new Date(b.updatedAt ?? "").getTime() -
  //         new Date(a.updatedAt ?? "").getTime(),
  //     )
  //     .slice(0, 5);
  // }, [allEvents]);

  // const handleDelete = (id: string) => {
  //   mutate(
  //     { id },
  //     {
  //       onSuccess: () => {
  //         toast.success("Event deleted successfully");
  //         queryClient.invalidateQueries({ queryKey: ["event"] });
  //       },
  //     },
  //   );
  // };

  const handleCopyUrl = (slug?: string) => {
    if (!slug) return toast.error("This event doesn't have a public link yet");
    const url = `${window.location.origin}/events/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Event URL copied to clipboard");
  };

  const handleArchiveToggle = (event: EventType) => {
    if (!event.archived) {
      const status = getEventStatus(event);
      const ticketsTaken = getTicketsTakenCount(event);
      if (status !== "past" && ticketsTaken > 0) {
        toast.error(
          "This event can't be archived while it still has tickets taken. You can archive it once the event has ended.",
        );
        return;
      }
    }

    archiveEvent(
      { id: event._id ?? "" },
      {
        onSuccess: () => {
          toast.success(event.archived ? "Event unarchived" : "Event archived");
          queryClient.invalidateQueries({ queryKey: ["event"] });
        },
        onError: (error: any) =>
          toast.error(parseErrorMessage(error, "Failed to update event")),
      },
    );
  };

  return (
    <div className="space-y-5">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl md:text-2xl font-bold text-primary">
          My events
        </h1>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/events/redemtion-table"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-primary border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
            title="Redemption Table">
            <ExternalLink size={14} />
            <span className="hidden sm:inline">Redemption Table</span>
          </Link>
          <Link
            href="/dashboard/events/verify-event"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-primary border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
            title="Verify Event">
            <ShieldCheck size={14} />
            <span className="hidden sm:inline">Verify Event</span>
          </Link>
          <Link
            href="/dashboard/events/add-event"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold bg-primary text-white rounded-full hover:bg-primary/90 transition-colors">
            <PlusCircle size={14} />
            <span>Add Event</span>
          </Link>
        </div>
      </div>

      <div className="grid gap-5 ">
        {/* ── Main list ── */}
        <div className="min-w-0 space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center flex-1 min-w-50">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="w-full rounded-l-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-primary/40"
                />
                <div className="flex items-center justify-center h-9 w-9 rounded-r-lg bg-primary text-white shrink-0">
                  <Search size={15} />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setActiveTab(f.key)}
                    className={`px-3.5 py-2 text-sm font-semibold rounded-full border transition-colors whitespace-nowrap ${
                      activeTab === f.key
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "text-gray-500 border-gray-200 hover:bg-gray-50"
                    }`}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-4 py-3 animate-pulse">
                  <div className="size-14 rounded-full bg-gray-200 shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-4 w-40 rounded bg-gray-200" />
                    <div className="h-3 w-28 rounded bg-gray-100" />
                    <div className="h-3 w-36 rounded bg-gray-100" />
                  </div>
                  <div className="hidden sm:block h-9 w-20 rounded-full bg-gray-200 shrink-0" />
                  <div className="h-9 w-9 rounded-lg bg-gray-100 shrink-0" />
                  <div className="h-9 w-9 rounded-lg bg-gray-100 shrink-0" />
                </div>
              ))
            ) : (
              <>
                {filteredEvents.map((event) => {
                  return (
                    <div
                      key={event._id}
                      className="flex items-center gap-4 bg-white border border-gray-200 rounded-2xl px-4 py-3 hover:shadow-sm transition-shadow flex-wrap sm:flex-nowrap">
                      <Avatar className="size-14 rounded-full border border-gray-100">
                        <AvatarImage
                          src={event.image}
                          alt={event.title}
                          className="object-cover"
                        />
                        <AvatarFallback>
                          {event.title?.[0] ?? "E"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-primary truncate">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-500 truncate">
                          {event.location_tba
                            ? "To be announced"
                            : event.venue || event.location}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          {formatEventDateTime(event)}
                        </p>
                      </div>

                      {/* <div className="hidden sm:block text-sm font-semibold text-primary shrink-0 w-16 text-right">
                    {formatEventPrice(event)}
                  </div>

                  <Badge
                    variant="secondary"
                    className={`shrink-0 ${STATUS_STYLES[status].className}`}>
                    {STATUS_STYLES[status].label}
                  </Badge> */}

                      <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
                        <Button
                          onClick={() =>
                            router.push(
                              `/dashboard/events/redemtion-table/${event._id}`,
                            )
                          }
                          size="sm"
                          className="bg-primary text-white hover:bg-primary/90 rounded-full">
                          Manage
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
                              <MoreVertical size={16} />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/events/${event.slug}`)
                              }>
                              <Eye className="h-4 w-4" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/dashboard/events/add-event?id=${event._id}`,
                                )
                              }>
                              <Edit className="h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleCopyUrl(event.slug)}>
                              <Link2 className="h-4 w-4" /> Copy URL
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleArchiveToggle(event)}>
                              {event.archived ? (
                                <>
                                  <ArchiveRestore className="h-4 w-4" />{" "}
                                  Unarchive
                                </>
                              ) : (
                                <>
                                  <Archive className="h-4 w-4" /> Archive
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* <DeleteConfirmDialog
                          onConfirm={() => handleDelete(event._id ?? "")}
                          text={event.title}
                          isPending={isPending}
                          header={
                            <button className="flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 transition-colors">
                              <Trash2 size={15} />
                            </button>
                          }
                        /> */}
                      </div>
                    </div>
                  );
                })}

                {filteredEvents.length === 0 && (
                  <div className="py-16 text-center bg-white border border-gray-200 rounded-2xl">
                    <p className="text-gray-400 text-sm">
                      No {activeTab} events found.
                    </p>
                    <Link
                      href="/dashboard/events/add-event"
                      className="mt-4 inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                      <PlusCircle size={14} /> Create your first event
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* <div className="hidden lg:block">
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <h2 className="font-bold text-primary pb-3 border-b border-gray-100">
              Recently updated events
            </h2>
            {recentlyUpdated.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {recentlyUpdated.map((event) => (
                  <li key={event._id} className="py-3">
                    <Link
                      href={`/dashboard/events/add-event?id=${event._id}`}
                      className="block hover:text-primary transition-colors">
                      <p className="font-semibold text-sm text-primary truncate">
                        {event.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatEventDateTime(event)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 pt-3">
                No recent updates yet.
              </p>
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
}
