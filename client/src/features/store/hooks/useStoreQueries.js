import { useQuery } from "@tanstack/react-query";
import { http } from "../../../api/http.js";

const STORE_QUERY_KEY = "store";

export const useStoreItemsQuery = (options = {}) => {
  return useQuery({
    queryKey: [STORE_QUERY_KEY, "items"],
    queryFn: async () => {
      const response = await http.get("/api/store");
      return Array.isArray(response) ? response : [];
    },
    ...options,
  });
};

export const useStoreItemQuery = ({ id, enabled = true, ...options }) => {
  return useQuery({
    queryKey: [STORE_QUERY_KEY, "item", id],
    enabled: Boolean(id) && enabled,
    queryFn: async () => {
      if (!id) {
        return null;
      }

      return http.get(`/api/store/${id}`);
    },
    ...options,
  });
};
