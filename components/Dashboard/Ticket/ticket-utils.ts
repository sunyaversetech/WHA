// Shared helpers for reading the three ticket shapes returned by /api/tickets
// (deal Redemption, EventRedemption, EventTicketPurchase) without duplicating
// this branching logic across the ticket list and the ticket detail page.

export type TicketCode = { key: string; label: string; checkedIn: boolean };

export function isEventItem(item: any): boolean {
  return !!item?.event;
}

export function getTicketTitle(item: any): string {
  return item?.event?.title ?? item?.deal?.title ?? "Ticket";
}

export function getTicketImage(item: any): string | null {
  return item?.event?.image ?? item?.deal?.image ?? null;
}

export function getTicketVenue(item: any): string | null {
  return item?.event?.venue || item?.event?.location || null;
}

export function getTicketDateRange(
  item: any,
): { from: string; to?: string } | null {
  return item?.event?.dateRange?.from ? item.event.dateRange : null;
}

export function isTicketPast(item: any): boolean {
  const now = new Date();
  if (item?.event?.dateRange?.from) return new Date(item.event.dateRange.from) < now;
  if (item?.deal?.valid_till) return new Date(item.deal.valid_till) < now;
  return false;
}

export function getSourceHref(item: any): string | null {
  if (item?.event?.slug) return `/events/${item.event.slug}`;
  if (item?.deal?._id) return `/deals/${item.deal._id}`;
  return null;
}

export function getMapHref(item: any): string | null {
  const lat = item?.event?.latitude;
  const lng = item?.event?.longitude;
  if (lat != null && lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  const query = item?.event?.venue || item?.event?.location;
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null;
}

// Flattens every QR-code the purchase/redemption is entitled to, tagging
// each with the ticket-type label and its own check-in state.
export function getTicketCodes(item: any): TicketCode[] {
  const verified: string[] = item?.verifiedKeys ?? [];
  const fallbackCheckedIn = item?.status === "verified";

  if (item?.items?.length) {
    return item.items.flatMap((lineItem: any) =>
      (lineItem.uniqueKeys || []).map((key: string) => ({
        key,
        label: lineItem.optionName || "General Admission",
        checkedIn: verified.includes(key),
      })),
    );
  }

  const keys: string[] = item?.uniqueKeys?.length
    ? item.uniqueKeys
    : item?.uniqueKey
      ? [item.uniqueKey]
      : [];

  return keys.map((key) => ({
    key,
    label: isEventItem(item) ? "General Admission" : "Deal Voucher",
    checkedIn: verified.includes(key) || fallbackCheckedIn,
  }));
}

export function sortPendingFirst<T extends { status?: string }>(arr: T[]): T[] {
  return [...arr].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1;
    if (a.status !== "pending" && b.status === "pending") return 1;
    return 0;
  });
}

export function formatDateLong(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-AU", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}
