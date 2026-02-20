"use client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useSearchParams } from "next/navigation";
import { Get, Post } from "./action";
import useQueryParams from "./hook.query-parse";

export function useFetcher<T>(
  baseKey: string | string[] | null,
  queryKey: string[] | null,
  url: string,
  enabled: boolean = true,
  defaultParams: Record<string, string | undefined> = {
    page: "1",
    per_page: "10",
  },
) {
  const searchParams = useSearchParams();
  const { parseQueryParam } = useQueryParams();
  const query = parseQueryParam(queryKey, undefined, defaultParams);

  return useQuery<
    T,
    AxiosError<{ message: string; error: Record<string, unknown> }>
  >({
    queryKey: [
      ...(Array.isArray(baseKey) ? baseKey : [baseKey]),
      ...(queryKey?.map((key) => searchParams.get(key)) || []),
    ],
    queryFn: async () =>
      Get({
        url: `${url}?${query.toString()}`,
      }),
    enabled,
  });
}

export function useMutator<T, X>(url: string) {
  return useMutation<
    T,
    AxiosError<{ message: string; error: Record<string, unknown> }>,
    X
  >({
    mutationFn: async (data) =>
      Post({
        url,
        data,
      }),
  });
}
