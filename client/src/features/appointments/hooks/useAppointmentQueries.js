import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useBooking } from "../../../context/BookingContext.jsx";
import { appointmentKeys } from "../queryKeys.js";

export const useMidwivesQuery = (options = {}) => {
  const { fetchMidwives } = useBooking();

  return useQuery({
    queryKey: appointmentKeys.midwives(),
    queryFn: fetchMidwives,
    ...options,
  });
};

export const useMidwifeQuery = (id, options = {}) => {
  const { fetchMidwife } = useBooking();

  return useQuery({
    queryKey: appointmentKeys.midwife(id),
    queryFn: () => fetchMidwife(id),
    enabled: Boolean(id) && (options.enabled ?? true),
    ...options,
  });
};

export const useAvailabilityQuery = (params = {}, options = {}) => {
  const { fetchAvailability } = useBooking();
  const { midwifeId, fromISO, toISO } = params;
  const enabled = Boolean(midwifeId && fromISO && toISO);

  return useQuery({
    queryKey: appointmentKeys.availability({ midwifeId, fromISO, toISO }),
    queryFn: () => fetchAvailability({ midwifeId, fromISO, toISO }),
    enabled: enabled && (options.enabled ?? true),
    ...options,
  });
};

export const useMyAppointmentsQuery = (userId, options = {}) => {
  const { fetchMyAppointments } = useBooking();

  return useQuery({
    queryKey: appointmentKeys.myAppointments(userId),
    queryFn: () => fetchMyAppointments({ userId }),
    enabled: Boolean(userId) && (options.enabled ?? true),
    ...options,
  });
};

export const useCreateAppointmentMutation = (options = {}) => {
  const { createAppointment } = useBooking();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => createAppointment(payload),
    onSuccess: (data, variables, context) => {
      if (variables?.userId) {
        queryClient.invalidateQueries({
          queryKey: appointmentKeys.myAppointments(variables.userId),
        });
      }

      if (variables?.midwifeId) {
        queryClient.invalidateQueries({
          queryKey: appointmentKeys.availabilityRoot(variables.midwifeId),
          exact: false,
        });
      }

      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options.onError?.(error, variables, context);
    },
  });
};

export const useCancelAppointmentMutation = (options = {}) => {
  const { cancelAppointment } = useBooking();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }) => cancelAppointment(id),
    onSuccess: (data, variables, context) => {
      if (variables?.userId) {
        queryClient.invalidateQueries({
          queryKey: appointmentKeys.myAppointments(variables.userId),
        });
      }

      if (variables?.midwifeId) {
        queryClient.invalidateQueries({
          queryKey: appointmentKeys.availabilityRoot(variables.midwifeId),
          exact: false,
        });
      }

      options.onSuccess?.(data, variables, context);
    },
    onError: (error, variables, context) => {
      options.onError?.(error, variables, context);
    },
  });
};
