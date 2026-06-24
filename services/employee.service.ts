import { Delete, Post } from "@/lib/action";
import { ApiResponseType } from "./apitypes";
import { useMutation } from "@tanstack/react-query";
import { useFetcher } from "@/lib/generic.service";

export const useGetEmployees = () => {
  return useFetcher<ApiResponseType<any[]>>(
    ["employees"],
    null,
    `/api/employees`,
  );
};

export const useDeleteEmployees = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["deleteEmployees"],
    mutationFn: (data: { id: string }) =>
      Delete<ApiResponseType<{ id: string }>>({
        url: `/api/employees/${data.id}`,
      }),
  });
};

export const useCreateOrUpdateEmployee = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["createOrUpdateEmployee"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: data.get("_id")
          ? `/api/employees/${data.get("_id")}`
          : "/api/employees",
        data: data,
      }),
  });
};

export const useGetSingleEmployee = (id: string) => {
  return useFetcher<ApiResponseType<any>>(
    ["employee", id],
    null,
    `/api/employees/${id}`,
  );
};
