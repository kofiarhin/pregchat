import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "../../../api/http.js";
import { adminKeys } from "../queryKeys.js";
import { store } from "../../../store/store.js";
import { enqueueToast } from "../../../store/ui/uiSlice.js";

const toOrderId = (order) => {
  if (!order) {
    return "";
  }
  if (order.id) {
    return order.id;
  }
  if (order._id) {
    return order._id.toString();
  }
  return "";
};

const getStatusFilterFromKey = (queryKey) => {
  if (!Array.isArray(queryKey)) {
    return undefined;
  }
  const candidate = queryKey[queryKey.length - 1];
  if (candidate && typeof candidate === "object" && !Array.isArray(candidate)) {
    return candidate.status ?? "";
  }
  return undefined;
};

const applyOrderUpdate = ({
  existing,
  orderId,
  nextStatus,
  notes,
  statusFilter,
  overwrite = false,
  orderData,
}) => {
  if (!existing) {
    return existing;
  }

  const source = Array.isArray(existing.data) ? existing.data : [];
  const index = source.findIndex((order) => toOrderId(order) === orderId);
  const baseOrder = index >= 0 ? source[index] : orderData ?? null;

  if (!baseOrder) {
    return existing;
  }

  const updatedOrder = {
    ...baseOrder,
    status: nextStatus ?? baseOrder.status,
    notes: notes !== undefined ? notes : baseOrder.notes,
  };

  if (index === -1) {
    if (!overwrite) {
      return existing;
    }

    const shouldInclude =
      !statusFilter ||
      statusFilter === "" ||
      statusFilter === "all" ||
      (updatedOrder.status && statusFilter === updatedOrder.status);

    if (!shouldInclude) {
      return existing;
    }

    const nextData = [updatedOrder, ...source];
    const pagination = existing.pagination
      ? {
          ...existing.pagination,
          totalItems:
            typeof existing.pagination.totalItems === "number"
              ? existing.pagination.totalItems + 1
              : existing.pagination.totalItems,
        }
      : existing.pagination;

    if (
      pagination &&
      typeof pagination.limit === "number" &&
      pagination.limit > 0 &&
      typeof pagination.totalItems === "number"
    ) {
      pagination.totalPages = Math.max(
        1,
        Math.ceil(pagination.totalItems / pagination.limit)
      );
      pagination.hasNext = pagination.page < pagination.totalPages;
      pagination.hasPrev = pagination.page > 1;
    }

    return { ...existing, data: nextData, pagination };
  }

  const shouldRemove =
    overwrite &&
    statusFilter &&
    statusFilter !== "" &&
    statusFilter !== "all" &&
    updatedOrder.status &&
    statusFilter !== updatedOrder.status;

  let nextData;

  if (shouldRemove) {
    nextData = [...source.slice(0, index), ...source.slice(index + 1)];
  } else {
    nextData = source.map((order, idx) => (idx === index ? updatedOrder : order));
  }

  let pagination = existing.pagination
    ? { ...existing.pagination }
    : existing.pagination;

  if (pagination && shouldRemove && typeof pagination.totalItems === "number") {
    pagination.totalItems = Math.max(0, pagination.totalItems - 1);
    if (typeof pagination.limit === "number" && pagination.limit > 0) {
      pagination.totalPages = Math.max(
        1,
        Math.ceil(pagination.totalItems / pagination.limit)
      );
      pagination.hasNext = pagination.page < pagination.totalPages;
      pagination.hasPrev = pagination.page > 1;
    }
  }

  return { ...existing, data: nextData, pagination };
};

const normalizeOrderResponse = (payload) => {
  if (!payload) {
    return null;
  }
  if (payload.order) {
    return payload.order;
  }
  return payload;
};

const updateOrderStatusRequest = async ({ orderId, status, notes }) => {
  if (!orderId) {
    throw new Error("Order ID is required");
  }
  if (!status) {
    throw new Error("Status is required");
  }

  const body = { status };
  if (notes !== undefined) {
    body.notes = notes;
  }

  const response = await http.patch(`/admin/orders/${orderId}/status`, {
    json: body,
  });
  return response;
};

export const useUpdateOrderStatusMutation = (options = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrderStatusRequest,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({
        queryKey: adminKeys.ordersRoot,
        exact: false,
      });

      const previous = queryClient.getQueriesData({
        queryKey: adminKeys.ordersRoot,
      });

      previous.forEach(([queryKey]) => {
        const statusFilter = getStatusFilterFromKey(queryKey);
        queryClient.setQueryData(queryKey, (current) =>
          applyOrderUpdate({
            existing: current,
            orderId: variables.orderId,
            nextStatus: variables.status,
            notes: variables.notes,
            statusFilter,
          })
        );
      });

      return { previous };
    },
    onError: (error, variables, context) => {
      context?.previous?.forEach(([queryKey, value]) => {
        queryClient.setQueryData(queryKey, value);
      });

      store.dispatch(
        enqueueToast({
          message: error?.message || "Failed to update order",
          tone: "error",
        })
      );

      options.onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      const order = normalizeOrderResponse(data);

      if (order?.id) {
        const queries = queryClient.getQueriesData({
          queryKey: adminKeys.ordersRoot,
        });

        queries.forEach(([queryKey]) => {
          const statusFilter = getStatusFilterFromKey(queryKey);
          queryClient.setQueryData(queryKey, (current) =>
            applyOrderUpdate({
              existing: current,
              orderId: order.id,
              nextStatus: order.status,
              notes: order.notes,
              statusFilter,
              overwrite: true,
              orderData: order,
            })
          );
        });
      }

      options.onSuccess?.(data, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: adminKeys.ordersRoot,
        exact: false,
      });
      options.onSettled?.(data, error, variables, context);
    },
  });
};
