import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";

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
  return useFetcher<ApiResponseType<any>>("favroite", null, "/api/favroite");
};

export const useGetPopulatedUserFavroite = () => {
  return useFetcher<ApiResponseType<any>>(
    "single-user-favroite",
    null,
    "/api/favroite/single-user-favorite",
  );
};
