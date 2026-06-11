import { Delete, Post } from "@/lib/action";
import { ApiResponseType } from "./apitypes";
import { useMutation } from "@tanstack/react-query";
import { useFetcher } from "@/lib/generic.service";

export const useGetServices = () => {
  return useFetcher<ApiResponseType<any[]>>(
    ["services"],
    null,
    `/api/services`,
  );
};

export const useDeleteServices = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["deleteServices"],
    mutationFn: (data: { id: string }) =>
      Delete<ApiResponseType<{ id: string }>>({
        url: `/api/services/single/${data.id}`,
      }),
  });
};

export const useCreateOrUpdateService = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["createOrUpdateService"],
    mutationFn: (data: any) =>
      Post<any, ApiResponseType<any>>({
        url: data._id ? `/api/services/${data._id}` : "/api/services",
        data: data,
      }),
  });
};

export const useGetSingleService = (id: string) => {
  return useFetcher<ApiResponseType<any>>(
    ["singleservice", id],
    null,
    `/api/services/single/${id}`,
  );
};
export const useGetUserService = () => {
  return useFetcher<ApiResponseType<any>>(
    ["userservice"],
    null,
    `/api/services/user`,
  );
};

export const useAssignEmployees = () => {
  return useMutation<
    ApiResponseType<any>,
    any,
    { serviceId: string; employeeId: string[] }
  >({
    mutationKey: ["assignEmployees"],
    mutationFn: (data: { serviceId: string; employeeId: string[] }) =>
      Post<any, ApiResponseType<any>>({
        url: `/api/services/assign-employee`,
        data: data,
      }),
  });
};
