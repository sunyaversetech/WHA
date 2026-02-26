import { ApiResponseType } from "./apitypes";
import { useMutation } from "@tanstack/react-query";
import { Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";
import { EventFormValues } from "@/components/Dashboard/Events/EventsForm";
import { useSearchParams } from "next/navigation";

export type EventType = {
  _id: string;
  title: string;
  description: string;
  date?: Date;
  dateRange?: {
    from: Date;
    to: Date;
  };
  user: {
    _id: string;
    email: string;
    business_name: string;
  };
  location: string;
  venue: string;
  category: string;
  image: string;
  latitude: number;
  longitude: number;
  ticket_link: string | null;
  ticket_price: string | null;
};

export const useCreateEvent = () => {
  return useMutation<ApiResponseType<EventFormValues>, any, EventFormValues>({
    mutationKey: ["createEvent"],
    mutationFn: (data: EventFormValues) =>
      Post<EventFormValues, ApiResponseType<EventFormValues>>({
        url: "/api/event",
        data: data,
      }),
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

  return useFetcher<ApiResponseType<EventFormValues[]>>(
    ["allEvents", category, search],
    null,
    `/api/event/getallevent?category=${category}&search=${search}`,
  );
};

export const useGetSingleEvent = (id: string) => {
  return useFetcher<ApiResponseType<EventType>>(
    ["singleEvent", id],
    null,
    `/api/event/single-event/${id}`,
  );
};
