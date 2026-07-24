import { Delete, Post, PATCH } from "@/lib/action";
import { ApiResponseType } from "./apitypes";
import { useMutation } from "@tanstack/react-query";
import { useFetcher } from "@/lib/generic.service";

export const useGetResourceOverrides = (
  weekStart?: string,
  weekEnd?: string,
) => {
  return useFetcher<ApiResponseType<any[]>>(
    ["resourceOverrides", weekStart ?? "", weekEnd ?? ""],
    null,
    `/api/resources/overrides${weekStart ? `?week_start=${weekStart}&week_end=${weekEnd}` : ""}`,
    !!(weekStart && weekEnd),
  );
};

export const useUpsertResourceOverride = () => {
  return useMutation<
    ApiResponseType<any>,
    any,
    {
      service_id: string;
      date: string;
      is_closed: boolean;
      quantity_override?: number | null;
    }
  >({
    mutationKey: ["upsertResourceOverride"],
    mutationFn: (payload) =>
      Post<any, ApiResponseType<any>>({
        url: `/api/resources/overrides`,
        data: payload,
      }),
  });
};

export const useUpdateResourceSchedule = () => {
  return useMutation<
    ApiResponseType<any>,
    any,
    {
      id: string;
      availability_type?: string;
      availability_schedule?: any[];
      max_concurrent_bookings?: number;
      group_schedule?: any[];
    }
  >({
    mutationKey: ["updateResourceSchedule"],
    mutationFn: ({ id, ...data }) =>
      PATCH<any, ApiResponseType<any>>({
        url: `/api/resources/${id}/schedule`,
        data,
      }),
  });
};

export const useDeleteResourceOverride = () => {
  return useMutation<
    ApiResponseType<any>,
    any,
    { service_id: string; date: string }
  >({
    mutationKey: ["deleteResourceOverride"],
    mutationFn: ({ service_id, date }) =>
      Delete<ApiResponseType<any>>({
        url: `/api/resources/overrides?service_id=${service_id}&date=${date}`,
      }),
  });
};
