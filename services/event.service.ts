import { ApiResponseType } from "./apitypes";
import { useMutation } from "@tanstack/react-query";
import { Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";
import { EventFormValues } from "@/components/Dashboard/Events/EventsForm";

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

export const useGetSingleEvent = (id: string) => {
  return useFetcher<ApiResponseType<EventFormValues>>(
    ["singletEvent", id],
    null,
    `/api/event/${id}`,
  );
};

export const useGetEvent = () => {
  return useFetcher<ApiResponseType<EventFormValues[]>>(
    ["event"],
    null,
    `/api/event`,
  );
};

export const useGetAllEvents = () => {
  return useFetcher<ApiResponseType<EventFormValues[]>>(
    ["allEvents"],
    null,
    "/api/event/getallevent",
  );
};
