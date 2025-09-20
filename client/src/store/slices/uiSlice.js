import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  loading: false,
  toast: {
    show: false,
    message: "",
    type: "info", // 'success', 'error', 'warning', 'info'
  },
  modal: {
    show: false,
    type: null,
    data: null,
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    showToast: (state, action) => {
      state.toast = {
        show: true,
        message: action.payload.message,
        type: action.payload.type || "info",
      };
    },
    hideToast: (state) => {
      state.toast.show = false;
    },
    showModal: (state, action) => {
      state.modal = {
        show: true,
        type: action.payload.type,
        data: action.payload.data || null,
      };
    },
    hideModal: (state) => {
      state.modal = {
        show: false,
        type: null,
        data: null,
      };
    },
  },
});

export const { setLoading, showToast, hideToast, showModal, hideModal } =
  uiSlice.actions;

export default uiSlice.reducer;
