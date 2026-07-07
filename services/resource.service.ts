import { Delete, Post, PATCH } from "@/lib/action";
import { ApiResponseType } from "./apitypes";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useFetcher } from "@/lib/generic.service";

export const useGetResources = () => {
  return useFetcher<ApiResponseType<any[]>>(["resources"], null, "/api/resources");
};

export const useGetSingleResource = (id: string) => {
  return useFetcher<ApiResponseType<any>>(
    ["singleResource", id],
    null,
    `/api/resources/${id}`,
  );
};

export const useCreateOrUpdateResource = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["createOrUpdateResource"],
    mutationFn: (data: any) =>
      data._id
        ? PATCH<any, ApiResponseType<any>>({ url: `/api/resources/${data._id}`, data })
        : Post<any, ApiResponseType<any>>({ url: "/api/resources", data }),
  });
};

export const useToggleResourceActive = () => {
  return useMutation<ApiResponseType<any>, any, { id: string; is_active: boolean }>({
    mutationKey: ["toggleResourceActive"],
    mutationFn: ({ id, is_active }) =>
      PATCH<{ is_active: boolean }, ApiResponseType<any>>({
        url: `/api/resources/${id}`,
        data: { is_active },
      }),
  });
};

export const useDeleteResource = () => {
  const qc = useQueryClient();
  return useMutation<ApiResponseType<any>, any, { id: string }>({
    mutationKey: ["deleteResource"],
    mutationFn: ({ id }) => Delete<ApiResponseType<any>>({ url: `/api/resources/${id}` }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["resources"] }),
  });
};
