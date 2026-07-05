import { Delete, Post, PATCH } from "@/lib/action";
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

export const useUpdateEmployeeSchedule = () => {
  return useMutation<
    ApiResponseType<any>,
    any,
    { empId: string; schedule: any[]; config?: any }
  >({
    mutationKey: ["updateEmployeeSchedule"],
    mutationFn: ({ empId, schedule, config }) =>
      PATCH<any, ApiResponseType<any>>({
        url: `/api/employees/${empId}/schedule`,
        data: {
          availability_schedule: schedule,
          ...(config && { repeating_schedule_config: config }),
        },
      }),
  });
};

export const useGetEmployeeTimeOff = (employeeId?: string) => {
  return useFetcher<ApiResponseType<any[]>>(
    ["employeeTimeOff", employeeId ?? ""],
    null,
    `/api/employees/time-off${employeeId ? `?employee_id=${employeeId}` : ""}`,
    !!employeeId,
  );
};

export const useCreateTimeOff = () => {
  return useMutation<ApiResponseType<any>, any, any>({
    mutationKey: ["createTimeOff"],
    mutationFn: (payload: any) =>
      Post<any, ApiResponseType<any>>({
        url: `/api/employees/time-off`,
        data: payload,
      }),
  });
};

export const useDeleteTimeOff = () => {
  return useMutation<ApiResponseType<any>, any, { id: string }>({
    mutationKey: ["deleteTimeOff"],
    mutationFn: ({ id }) =>
      Delete<ApiResponseType<any>>({ url: `/api/employees/time-off/${id}` }),
  });
};

export const useGetShiftOverrides = (weekStart?: string, weekEnd?: string) => {
  return useFetcher<ApiResponseType<any[]>>(
    ["shiftOverrides", weekStart ?? "", weekEnd ?? ""],
    null,
    `/api/employees/shift-overrides${weekStart ? `?week_start=${weekStart}&week_end=${weekEnd}` : ""}`,
    !!(weekStart && weekEnd),
  );
};

export const useUpsertShiftOverride = () => {
  return useMutation<
    ApiResponseType<any>,
    any,
    { employee_id: string; date: string; shifts?: { start: string; end: string }[]; is_day_off?: boolean }
  >({
    mutationKey: ["upsertShiftOverride"],
    mutationFn: (payload) =>
      Post<any, ApiResponseType<any>>({
        url: `/api/employees/shift-overrides`,
        data: payload,
      }),
  });
};

export const useDeleteShiftOverride = () => {
  return useMutation<ApiResponseType<any>, any, { id: string }>({
    mutationKey: ["deleteShiftOverride"],
    mutationFn: ({ id }) =>
      Delete<ApiResponseType<any>>({
        url: `/api/employees/shift-overrides/${id}`,
      }),
  });
};
