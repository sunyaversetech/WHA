"use client";
import { ParsedUrlQuery } from "querystring";
import { useSearchParams } from "next/navigation";

interface AdditionalParams {
  [key: string]: string | number | undefined;
}

interface DefaultParams {
  [key: string]: string | number | undefined | boolean;
}

const useQueryParams = () => {
  const searchParams = useSearchParams();

  /**
   * @function getQueryParams
   * @description Get query params from the URL
   * @returns {ParsedUrlQuery} - Object of query params
   * */

  const getQueryParams = <T extends ParsedUrlQuery>(): T => {
    let queryParams: Partial<T> = {};
    for (const [key, value] of Array.from(searchParams?.entries())) {
      queryParams = { ...queryParams, [key]: value };
    }
    return queryParams as T;
  };

  /**
   * @function deleteQueryParams
   * @description Delete query params from the URL
   * @param {string[]} params - Array of query params to delete
   * @returns {URLSearchParams} - URLSearchParams object
   * */

  const deleteQueryParams = (params: string[]): URLSearchParams => {
    const query = new URLSearchParams();
    params.forEach((name) => {
      query.delete(name);
    });
    return query;
  };

  {
    /**
     * @function parseQueryParam
     * @description Parse query params from the URL
     * @param {string[]} params - Array of query params to parse
     * @param {AdditionalParams} additionalParams - Additional query params to add
     * @param {DefaultParams} defaultParams - Default query params
     * */
  }
  const parseQueryParam = (
    params: string[] | null,
    additionalParams?: AdditionalParams,
    defaultParams?: DefaultParams
  ): URLSearchParams => {
    const query = new URLSearchParams();
    params?.forEach((param) => {
      let value = searchParams.get(param);
      if (value === null && defaultParams && defaultParams[param]) {
        value = defaultParams[param]?.toString() as string;
      }
      if (value) {
        query.append(param, value);
      }
    });

    if (additionalParams) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        if (value !== undefined) {
          query.append(key, value.toString());
        }
      });
    }

    return query;
  };

  return {
    getQueryParams,
    deleteQueryParams,
    parseQueryParam,
  };
};

export default useQueryParams;
