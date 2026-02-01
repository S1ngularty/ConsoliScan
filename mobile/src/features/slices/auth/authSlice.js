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

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    role: "guest",
    eligible: null,
    isLoggedIn: false,
    loading: false,
    error: null,
    isNewUser: false,
  },
  reducers: {},

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
        state.loading = false;
        state.isNewUser = true;
      })
      .addCase(register.rejected, rejectedState)

      .addCase(logout.rejected, rejectedState)
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.role = "guest";
        state.eligible = null;
        state.isLoggedIn = false;
        state.loading = false;
        state.error = null;
        state.isNewUser = false;
      })
      .addCase(logout.pending, pendingState);
  },
});

export default authSlice.reducer;
