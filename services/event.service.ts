import { ApiResponseType } from "./apitypes";
import { useMutation } from "@tanstack/react-query";
import { PATCH, Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";
import { EventFormValues } from "@/components/Dashboard/Events/EventsForm";
import { useSearchParams } from "next/navigation";
import { ReviewType } from "./review.service";

export type EventOptionType = {
  _id?: string;
  name?: string;
  release_date?: string | null;
  close_date?: string | null;
  price?: number | null;
  capacity?: number | null;
  sold?: number | null;
  held?: number | null;
};

export type EventPromoCodeType = {
  _id?: string;
  code?: string;
  discount_percentage?: number | null;
  limit?: number | null;
  used?: number | null;
  applicable_options?: string[];
};

export type EventType = {
  _id: string;
  title: string;
  description: string;
  date?: Date;
  dateRange?: {
    from: string;
    to: string;
  };
  user: {
    _id: string;
    email: string;
    name: string;
    business_name: string;
    city: string;
    location: string;
    image: string;
  };
  location: string;
  location_tba?: boolean;
  event_rules?: string;
  refund_policy?: string;
  host_name?: string;
  support_details?: string;
  category_name: string;
  email: string;
  phone_number: string;
  website_link: string;
  reviews: ReviewType[];
  price_category: "registration" | "paid" | "external";
  registration_capacity?: number | null;
  registration_sold?: number | null;
  max_tickets_per_request?: number | null;
  show_remaining_tickets?: boolean;
  community_name: string;
  city: string;
  community: string;
  startTime: string;
  endTime: string;
  venue: string;
  category: string;
  image: string;
  latitude: number;
  isSponsor: boolean;
  longitude: number;
  geo?: { type: string; coordinates: [number, number] };
  distance?: number; // metres from user when geo query is active
  ticket_link: string | null;
  ticket_price: string | null;
  max_quantity: string | null;
  sold_quantity: string | null;
  options?: EventOptionType[];
  promo_codes?: EventPromoCodeType[];
  slug?: string;
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
};

type RedeemCodeType = {
  eventId: string;
  userId: string;
  business: string;
};

type RedeemCodeResponseType = {
  event: string;
  user: string;
  business: string;
  uniqueKey: string;
  status: "pending" | "verified";
  verifiedAt?: Date;
};

type RedeemCodeFormResponseType = {
  success: string;
  uniqueKey: string;
};

type PurchaseTicketType = {
  eventId: string;
  paymentIntentId: string;
};

type PurchaseTicketResponseType = {
  success: boolean;
  invoiceNumber: string;
  items: { optionName: string; codes: string[] }[];
};

export const useCreateEvent = () => {
  return useMutation<ApiResponseType<EventFormValues>, any, FormData>({
    mutationKey: ["createEvent"],
    mutationFn: (data: FormData) => {
      if (data.get("_id")) {
        return PATCH<FormData, ApiResponseType<EventFormValues>>({
          url: `/api/event/edit/${data.get("_id")}`,
          data: data,
        });
      } else {
        return Post<FormData, ApiResponseType<EventFormValues>>({
          url: "/api/event",
          data: data,
        });
      }
    },
  });
};

export const useGetEvent = () => {
  return useFetcher<ApiResponseType<EventType[]>>(
    ["event"],
    null,
    `/api/event`,
  );
};

export const useGetAllEvents = () => {
  const param = useSearchParams();

  const category = param.get("category") || "";
  const search = param.get("search") || "";
  const city = param.get("city") || "";
  const community = param.get("community") || "";
  const from = param.get("from") || "";
  const to = param.get("to") || "";
  const lat = param.get("lat") || "";
  const lng = param.get("lng") || "";
  const radius = param.get("radius") || "";

  return useFetcher<ApiResponseType<EventFormValues[]>>(
    [
      "allEvents",
      category,
      search,
      city,
      community,
      from,
      to,
      lat,
      lng,
      radius,
    ],
    null,
    `/api/event/getallevent?category=${category}&search=${search}&city=${city}&community=${community}&from=${from}&to=${to}&lat=${lat}&lng=${lng}&radius=${radius}`,
  );
};

export const useGetSingleEvent = (id: string) => {
  return useFetcher<ApiResponseType<EventType>>(
    ["singleEvent", id],
    null,
    `/api/event/single-event/${id}`,
  );
};
export const useGetSingleForForm = (id: string) => {
  return useFetcher<ApiResponseType<EventType>>(
    ["singleEventForm", id],
    null,
    `/api/event/single-event-for-form/${id}`,
  );
};

// export const useDeleteEvent = () => {
//   return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
//     mutationKey: ["deleteEvent"],
//     mutationFn: (data: { id: string }) =>
//       Post<{ id: string }, ApiResponseType<any>>({
//         url: `/api/event/delete/${data.id}`,
//         data: data,
//       }),
//   });
// };

export const useArchiveEvent = () => {
  return useMutation<ApiResponseType<EventType>, any, { id: string }>({
    mutationKey: ["archiveEvent"],
    mutationFn: ({ id }: { id: string }) =>
      Post<null, ApiResponseType<EventType>>({
        url: `/api/event/archive/${id}`,
        data: null,
      }),
  });
};

export const useVerifyEvent = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["verify-event"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: `/api/event/verify`,
        data: data,
      }),
  });
};

export const useRedeemEventCode = () => {
  return useMutation<RedeemCodeFormResponseType, any, RedeemCodeType>({
    mutationKey: ["getRedeem"],
    mutationFn: (data: RedeemCodeType) =>
      Post<RedeemCodeType, RedeemCodeFormResponseType>({
        url: "/api/event/redeem",
        data: data,
      }),
  });
};

export const useGetEventRedeem = () => {
  return useFetcher<ApiResponseType<RedeemCodeResponseType[]>>(
    "redeem",
    null,
    "/api/event/redeem",
  );
};
export const useGetEventRedeemBusiness = () => {
  return useFetcher<ApiResponseType<RedeemCodeResponseType[]>>(
    "redeem-business",
    null,
    "/api/event/redeem/get-business",
  );
};

export const useGetEventTicketPurchase = (eventId?: string) => {
  return useFetcher<ApiResponseType<any[]>>(
    ["ticket-purchase-business", eventId || ""],
    null,
    eventId
      ? `/api/event/ticket/purchase?eventId=${eventId}`
      : `/api/event/ticket/purchase`,
  );
};

export const useGetEventVerifyUsers = (id: string) => {
  return useFetcher<ApiResponseType<RedeemCodeResponseType[]>>(
    ["verify-users", id],
    null,
    `/api/event/verify/${id}`,
  );
};

export const useSetTicketStatus = () => {
  return useMutation<
    { success: boolean; status: string },
    any,
    { uniqueKey: string; status: "verified" | "pending" }
  >({
    mutationKey: ["set-ticket-status"],
    mutationFn: (data) =>
      Post<typeof data, { success: boolean; status: string }>({
        url: "/api/event/verify/manual",
        data,
      }),
  });
};

export const useSendInvoice = () => {
  return useMutation<
    { success: boolean; message: string },
    any,
    { purchaseId: string }
  >({
    mutationKey: ["send-invoice"],
    mutationFn: ({ purchaseId }) =>
      Post<null, { success: boolean; message: string }>({
        url: `/api/event/ticket/purchase/${purchaseId}/send-invoice`,
        data: null,
      }),
  });
};

export const useFinalizeEventTicketPurchase = () => {
  return useMutation<PurchaseTicketResponseType, any, PurchaseTicketType>({
    mutationKey: ["purchaseEventTicket"],
    mutationFn: (data: PurchaseTicketType) =>
      Post<PurchaseTicketType, PurchaseTicketResponseType>({
        url: "/api/event/ticket/purchase",
        data: data,
      }),
  });
};

type HoldTicketsType = {
  eventId: string;
  items: { optionId: string; quantity: number }[];
  paymentIntentId: string;
};

type HoldTicketsResponseType = {
  success: boolean;
  expiresAt: string;
};

export const useHoldTickets = () => {
  return useMutation<HoldTicketsResponseType, any, HoldTicketsType>({
    mutationKey: ["holdTickets"],
    mutationFn: (data: HoldTicketsType) =>
      Post<HoldTicketsType, HoldTicketsResponseType>({
        url: "/api/event/ticket/hold",
        data,
      }),
  });
};

export const useReleaseTicketHold = () => {
  return useMutation<
    { success: boolean },
    any,
    { paymentIntentId: string }
  >({
    mutationKey: ["releaseTicketHold"],
    mutationFn: (data: { paymentIntentId: string }) =>
      Post<{ paymentIntentId: string }, { success: boolean }>({
        url: "/api/event/ticket/hold/release",
        data,
      }),
  });
};
