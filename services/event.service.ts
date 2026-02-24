import { EventFormValues } from "@/components/Dashboard/Events/EventsForm";
import { ApiResponseType } from "./apitypes";
import { useMutation } from "@tanstack/react-query";
import { Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";

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
  return useFetcher<ApiResponseType<EventFormValues[]>>(
    ["allEvents"],
    null,
    "/api/event?personal=true",
  );
};
