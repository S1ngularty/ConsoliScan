import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isOffline: false,
  isServerDown: false,
  lastError: null,
};

const networkSlice = createSlice({
  name: "network",
  initialState,
  reducers: {
    setOffline(state, action) {
      state.isOffline = Boolean(action.payload);
    },
    setServerDown(state, action) {
      state.isServerDown = Boolean(action.payload);
    },
    setLastError(state, action) {
      state.lastError = action.payload || null;
    },
    clearNetworkError(state) {
      state.lastError = null;
    },
  },
});

export const { setOffline, setServerDown, setLastError, clearNetworkError } =
  networkSlice.actions;

export default networkSlice.reducer;
