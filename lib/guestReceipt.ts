import type { GuestReceiptType } from "@/services/event.service";

// Guest checkout has no account to list past purchases under, so the
// post-payment receipt page is handed its data via sessionStorage instead of
// a public, unauthenticated "fetch purchase by id" endpoint — nothing is
// ever served over the network for it. That also means the URL naturally
// can't be opened by typing/pasting it into a fresh tab: sessionStorage is
// scoped to the tab that completed the checkout, so a fresh navigation finds
// nothing and the page shows its not-found state instead of leaking data.
const STORAGE_PREFIX = "wha-guest-receipt-";

export type GuestReceiptTicket = {
  _id: string;
  holderName: string;
  event: GuestReceiptType["event"];
  items: GuestReceiptType["items"];
  invoiceNumber: string;
  ticketTotal: number;
  serviceFee: number;
  surcharge: number;
  totalAmount: number;
  promoCode?: string;
  createdAt: string;
  verifiedKeys: string[];
  status: string;
};

export function storeGuestReceipt(
  purchaseId: string,
  receipt: GuestReceiptType,
) {
  const ticket: GuestReceiptTicket = {
    _id: purchaseId,
    holderName: receipt.holderName,
    event: receipt.event,
    items: receipt.items,
    invoiceNumber: receipt.invoiceNumber,
    ticketTotal: receipt.ticketTotal,
    serviceFee: receipt.serviceFee,
    surcharge: receipt.surcharge,
    totalAmount: receipt.totalAmount,
    promoCode: receipt.promoCode,
    createdAt: receipt.createdAt,
    verifiedKeys: [],
    status: "pending",
  };
  try {
    sessionStorage.setItem(
      STORAGE_PREFIX + purchaseId,
      JSON.stringify(ticket),
    );
  } catch {
    // Private-browsing/locked-down storage — the receipt page will simply
    // show its not-found state, which is a safe fallback either way.
  }
}

export function loadGuestReceipt(purchaseId: string): GuestReceiptTicket | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + purchaseId);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
