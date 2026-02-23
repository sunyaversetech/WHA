import { useMutation } from "@tanstack/react-query";
import { ApiResponseType } from "./apitypes";
import { CategoryFormValues } from "@/components/Dashboard/Inventory/CreateCategoryDialog";
import { Post } from "@/lib/action";
import { useFetcher } from "@/lib/generic.service";
import {
  Category,
  ServicePostTypeSchema,
} from "@/components/Dashboard/Inventory/Service";

export const useGetActivity = () => {
  return useFetcher<ApiResponseType<Category[]>>(
    "category",
    null,
    "/api/inventory",
  );
};
export const useCreateCategory = () => {
  return useMutation<
    ApiResponseType<CategoryFormValues>,
    any,
    CategoryFormValues
  >({
    mutationKey: ["createCategory"],
    mutationFn: (data: CategoryFormValues) =>
      Post<CategoryFormValues, ApiResponseType<CategoryFormValues>>({
        url: "/api/inventory",
        data: data,
      }),
  });
};

export const useGetServicesByCategory = (categoryId: string) => {
  return useFetcher<ApiResponseType<any>>(
    ["services", categoryId],
    null,
    `/api/inventory/${categoryId}`,
  );
};

export const useCreateService = (categoryId: string) => {
  return useMutation<
    ApiResponseType<ServicePostTypeSchema>,
    any,
    ServicePostTypeSchema
  >({
    mutationKey: ["createService", categoryId],
    mutationFn: (data) =>
      Post<ServicePostTypeSchema, ApiResponseType<ServicePostTypeSchema>>({
        url: `/api/inventory/${categoryId}`,
        data,
      }),
  });
};
