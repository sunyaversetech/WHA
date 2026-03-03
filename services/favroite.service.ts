import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";
import { EventFormValues } from "@/components/Dashboard/Events/EventsForm";
import { DealsGetValues } from "./deal.service";

type FavoriteType = {
  events: EventFormValues[];
  services: any;
  deals: DealsGetValues[];
};

export const useCreateFavroite = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["createFavroite"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: "/api/favroite",
        data: data,
      }),
  });
};

export const useGetUserFavroite = () => {
  return useFetcher<ApiResponseType<FavoriteType>>(
    "favroite",
    null,
    "/api/favroite",
  );
};
