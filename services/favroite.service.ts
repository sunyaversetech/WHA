import { useMutation } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ApiResponseType } from "./apitypes";
import { Post } from "@/lib/client-fetch";
import { useFetcher } from "@/lib/generic.service";
import { EventFormValues } from "@/components/Dashboard/Events/EventsForm";
import { DealsGetValues } from "./deal.service";
import { SingUPFormSchema } from "@/components/Auth/BusinessSignupPage";

type FavoriteType = {
  _id: string;
  events: EventFormValues[];
  services: any;
  deals: DealsGetValues[];
  business: SingUPFormSchema[];
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
  // Logged-out visitors can't have favourites — skip the request instead
  // of firing it (and getting an empty/unauthorized result back) on every
  // card and every detail page regardless of auth state.
  const { data: session } = useSession();
  return useFetcher<ApiResponseType<FavoriteType>>(
    "favroite",
    null,
    "/api/favroite",
    !!session,
  );
};
