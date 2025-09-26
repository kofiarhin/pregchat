import { useQuery } from "@tanstack/react-query";
import { http } from "../../../api/http.js";
import { adminKeys } from "../queryKeys.js";

const DEFAULT_LIMIT = 10;

const buildSearchParams = (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.status) {
    searchParams.set("status", params.status);
  }
  if (params.page) {
    searchParams.set("page", String(params.page));
  }
  if (params.limit) {
    searchParams.set("limit", String(params.limit));
  }
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

const normalizeOrdersPayload = (payload) => {
  if (!payload) {
    return { data: [], pagination: { page: 1, limit: DEFAULT_LIMIT, totalItems: 0, totalPages: 1, hasNext: false, hasPrev: false } };
  }

  const data = Array.isArray(payload.data) ? payload.data : [];
  const pagination = payload.pagination || {};

  return {
    data,
    pagination: {
      page: pagination.page ?? 1,
      limit: pagination.limit ?? DEFAULT_LIMIT,
      totalItems: pagination.totalItems ?? data.length,
      totalPages: pagination.totalPages ?? 1,
      hasNext: Boolean(pagination.hasNext),
      hasPrev: Boolean(pagination.hasPrev),
    },
  };
};

const fetchAdminOrders = async ({ status = "", page = 1, limit = DEFAULT_LIMIT } = {}) => {
  const normalizedStatus = status === "all" ? "" : status;
  const query = buildSearchParams({ status: normalizedStatus, page, limit });
  const response = await http.get(`/admin/orders${query}`);
  return normalizeOrdersPayload(response);
};

export const useAdminOrdersQuery = (
  { status = "", page = 1, limit = DEFAULT_LIMIT } = {},
  options = {}
) =>
  useQuery({
    queryKey: adminKeys.orders({ status, page, limit }),
    queryFn: () => fetchAdminOrders({ status, page, limit }),
    keepPreviousData: true,
    ...options,
  });
