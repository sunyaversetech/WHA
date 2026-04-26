import { ApiResponseType } from "./apitypes";
import { useMutation } from "@tanstack/react-query";
import { PATCH, Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";
import { EventFormValues } from "@/components/Dashboard/Events/EventsForm";
import { useSearchParams } from "next/navigation";
import { ReviewType } from "./review.service";

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
  category_name: string;
  email: string;
  phone_number: string;
  website_link: string;
  reviews: ReviewType[];
  price_category: "free" | "paid";
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
  ticket_link: string | null;
  ticket_price: string | null;
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
  return useFetcher<ApiResponseType<EventFormValues[]>>(
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

  return useFetcher<ApiResponseType<EventFormValues[]>>(
    ["allEvents", category, search, city, community, from, to],
    null,
    `/api/event/getallevent?category=${category}&search=${search}&city=${city}&community=${community}&from=${from}&to=${to}`,
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

export const useDeleteEvent = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["deleteEvent"],
    mutationFn: (data: { id: string }) =>
      Post<{ id: string }, ApiResponseType<any>>({
        url: `/api/event/delete/${data.id}`,
        data: data,
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

export const useGetEventVerifyUsers = (id: string) => {
  return useFetcher<ApiResponseType<RedeemCodeResponseType[]>>(
    "verify-users",
    null,
    `/api/event/verify/${id}`,
  );
};
