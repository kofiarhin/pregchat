import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  dayIndex: null,
  lmpDate: null,
  dueDate: null,
  loading: false,
  error: null,
};

const pregnancySlice = createSlice({
  name: "pregnancy",
  initialState,
  reducers: {
    setPregnancyProfile: (state, action) => {
      state.dayIndex = action.payload.dayIndex;
      state.lmpDate = action.payload.lmpDate;
      state.dueDate = action.payload.dueDate;
    },
    updateDayIndex: (state, action) => {
      state.dayIndex = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setPregnancyProfile,
  updateDayIndex,
  setLoading,
  setError,
  clearError,
} = pregnancySlice.actions;

export default pregnancySlice.reducer;
