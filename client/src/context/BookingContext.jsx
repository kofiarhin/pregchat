import React, { createContext, useContext, useMemo } from "react";
import { http } from "../api/http.js";
import { useCurrentUserQuery } from "../features/auth/hooks/useAuth.js";
import { useAppSelector } from "../store/store.js";
import { selectAuthToken } from "../store/ui/uiSlice.js";

const BookingContext = createContext(null);

const createIdentity = (user) => {
  if (!user) {
    return {
      userId: "",
      userName: "",
      userEmail: "",
    };
  }

  return {
    userId: user._id ?? user.id ?? "",
    userName: user.name ?? user.firstName ?? "",
    userEmail: user.email ?? "",
  };
};

const BookingProvider = ({ children }) => {
  const token = useAppSelector(selectAuthToken);
  const { data: currentUser } = useCurrentUserQuery({
    enabled: Boolean(token),
    staleTime: 1000 * 60 * 5,
  });

  const identity = useMemo(() => createIdentity(currentUser), [currentUser]);

  const value = useMemo(() => {
    const fetchMidwives = () => http.get("/api/midwives");
    const fetchMidwife = (id) => http.get(`/api/midwives/${id}`);
    const fetchAvailability = (payload) =>
      http.post("/api/appointments/availability", { json: payload });
    const createAppointment = (payload) =>
      http.post("/api/appointments", { json: payload });
    const cancelAppointment = (id) => http.delete(`/api/appointments/${id}`);
    const fetchMyAppointments = ({ userId }) => {
      const params = new URLSearchParams();
      if (userId) {
        params.set("userId", userId);
      }
      const query = params.toString();
      const path = query ? `/api/appointments/my?${query}` : "/api/appointments/my";
      return http.get(path);
    };

    return {
      identity,
      fetchMidwives,
      fetchMidwife,
      fetchAvailability,
      createAppointment,
      cancelAppointment,
      fetchMyAppointments,
    };
  }, [identity]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
};

export const useBooking = () => {
  const context = useContext(BookingContext);

  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }

  return context;
};

export default BookingProvider;
