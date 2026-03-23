"use client";
import { useFetcher } from "@/lib/generic.service";
import { ApiResponseType } from "./apitypes";
import { UserBusinessType } from "./business.service";
import { EventType } from "./event.service";
import { DealsGetValues } from "./deal.service";
import { useMutation } from "@tanstack/react-query";
import { Post } from "@/lib/action";

export const useSuperAdminGetALLBusiness = () => {
  return useFetcher<ApiResponseType<UserBusinessType[]>>(
    ["getsuperadminbusinesses"],
    null,
    `/api/super-admin/business`,
  );
};

export const useSuperAdminGetALLUsers = () => {
  return useFetcher<ApiResponseType<UserBusinessType[]>>(
    ["getbusinesses"],
    null,
    `/api/super-admin/users`,
  );
};

export const useSuperAdminGetALLEvents = () => {
  return useFetcher<ApiResponseType<EventType[]>>(
    ["getSuperAdminEvents"],
    null,
    `/api/super-admin/events`,
  );
};

export const useSuperAdminGetALLDeal = () => {
  return useFetcher<ApiResponseType<DealsGetValues[]>>(
    ["getSuperAdminDeals"],
    null,
    `/api/super-admin/deals`,
  );
};

// export const useDeleteBusinessOrUser = () => {
//   return useFetcher<ApiResponseType<UserBusinessType[]>>(
//     ["getbusinesses"],
//     null,
//     `/api/super-admin/businesses/delete`,
//   );
// };

export const useDeleteBusinessOrUser = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["deleteBusinessOrUser"],
    mutationFn: (data: { id: string }) =>
      Post<{ id: string }, ApiResponseType<any>>({
        url: `/api/super-admin/business/delete/${data.id}`,
        data: data,
      }),
  });
};

export const useVerifyBusiness = () => {
  return useMutation<
    ApiResponseType<{ id: string; verified: boolean }>,
    any,
    { id: string; verified: boolean }
  >({
    mutationKey: ["verifyBusiness"],
    mutationFn: (data: { id: string; verified: boolean }) =>
      Post<{ id: string; verified: boolean }, ApiResponseType<any>>({
        url: `/api/super-admin/business/update-verify/${data.id}`,
        data: data,
      }),
  });
};
export const useBlockBusinessOrUser = () => {
  return useMutation<
    ApiResponseType<{ id: string; isblocked: boolean }>,
    any,
    { id: string; isblocked: boolean }
  >({
    mutationKey: ["blockBusiness"],
    mutationFn: (data: { id: string; isblocked: boolean }) =>
      Post<{ id: string; isblocked: boolean }, ApiResponseType<any>>({
        url: `/api/super-admin/business/block/${data.id}`,
        data: data,
      }),
  });
};
export const useSponsorBusiness = () => {
  return useMutation<
    ApiResponseType<{ id: string; sponser: boolean }>,
    any,
    { id: string; sponser: boolean }
  >({
    mutationKey: ["sponsorBusiness"],
    mutationFn: (data: { id: string; sponser: boolean }) =>
      Post<{ id: string; sponser: boolean }, ApiResponseType<any>>({
        url: `/api/super-admin/sponsor`,
        data: data,
      }),
  });
};

export const useSuperAdminDeleteDeal = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["deleteSuperAdminDeals"],
    mutationFn: (data: { id: string }) =>
      Post<{ id: string }, ApiResponseType<any>>({
        url: `/api/super-admin/deals/${data.id}`,
        data: data,
      }),
  });
};

export const useSuperAdminDeleteEvent = () => {
  return useMutation<ApiResponseType<{ id: string }>, any, { id: string }>({
    mutationKey: ["deleteSuperAdminDeals"],
    mutationFn: (data: { id: string }) =>
      Post<{ id: string }, ApiResponseType<any>>({
        url: `/api/super-admin/events/${data.id}`,
        data: data,
      }),
  });
};
