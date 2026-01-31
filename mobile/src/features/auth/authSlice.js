import { createSlice } from "@reduxjs/toolkit";
import { login, register, verifyToken } from "./authThunks";

function pendingState(state) {
  state.loading = true;
}

function fulfilledState(state, action) {
  state.loading = false;
  state.isLoggedIn = true;
  state.user = action.payload.result.user;
  state.eligible = action.payload.result.eligibilityStatus || null;
}

function rejectedState(state, action) {
  state.loading = false;
  state.error = action.error.message;
}

const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
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
      .addCase(register.rejected, rejectedState);
  },
});

export const {} = authSlice.actions;
export default authSlice.reducer;
