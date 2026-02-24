import { createSlice } from "@reduxjs/toolkit";
import { login, register, verifyToken, logout } from "./authThunks";

function pendingState(state) {
  state.loading = true;
}

function fulfilledState(state, action) {
  state.loading = false;
  state.isLoggedIn = true;
  state.role = action.payload.user.role;
  state.user = action.payload.user;
  state.eligible = action.payload.eligibilityStatus || null;
}

function rejectedState(state, action) {
  state.loading = false;
  state.error = action.error.message;
}

const initialState = {
  user: null,
  role: "",
  eligible: null,
  isLoggedIn: false,
  loading: false,
  error: null,
  isNewUser: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authMode: (state, action) => {
      const payload = action.payload;
      state.role = payload.user.role;
      state.user = payload.user;
      state.eligible = payload.eligibilityStatus || null;
      state.isLoggedIn = true;
    },
    guestMode: (state, action) => {
      state.role = "guest";
    },
    resetState: (state) => {
      return initialState;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(login.pending, pendingState)
      .addCase(login.fulfilled, fulfilledState)
      .addCase(login.rejected, rejectedState)

      .addCase(verifyToken.pending, pendingState)
      .addCase(verifyToken.fulfilled, fulfilledState)
      .addCase(verifyToken.rejected, rejectedState)

      .addCase(register.pending, pendingState)
      .addCase(register.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.role = action.payload.user.role;
        state.isLoggedIn = true;
        state.loading = false;
        state.isNewUser = true;
        state.loading = false;
        state.eligible = null;
      })
      .addCase(register.rejected, rejectedState)

      .addCase(logout.rejected, rejectedState)
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.role = "";
        state.eligible = null;
        state.isLoggedIn = false;
        state.loading = false;
        state.error = null;
        state.isNewUser = false;
      })
      .addCase(logout.pending, pendingState);
  },
});

export const { guestMode, resetState, authMode } = authSlice.actions;

export default authSlice.reducer;
