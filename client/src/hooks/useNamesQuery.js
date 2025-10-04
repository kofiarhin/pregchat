import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { http } from "../api/http.js";

const NAMES_QUERY_KEY = "names";

const createQueryString = (params) => {
  const search = new URLSearchParams();

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    search.append(key, value);
  });

  const query = search.toString();
  return query ? `?${query}` : "";
};

const createQueryKey = (params) => {
  if (!params || Object.keys(params).length === 0) {
    return [NAMES_QUERY_KEY];
  }

  const sortedEntries = Object.entries(params).sort(([a], [b]) =>
    a.localeCompare(b)
  );

  return [NAMES_QUERY_KEY, Object.fromEntries(sortedEntries)];
};

const useNamesQuery = (params = {}, options = {}) => {
  const queryParams = useMemo(() => ({ ...params }), [JSON.stringify(params)]);
  const queryKey = useMemo(() => createQueryKey(queryParams), [queryParams]);
  const queryString = useMemo(
    () => createQueryString(queryParams),
    [queryParams]
  );

  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await http.get(`/api/names${queryString}`);
      if (!Array.isArray(response)) {
        return [];
      }

      return response.filter((value) => typeof value === "string");
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export default useNamesQuery;
