import { createAsyncThunk } from "@reduxjs/toolkit";
import { loginApi, verifyTokenApi } from "./authService";

export const login = createAsyncThunk("auth/login", async (credentials) => {
  return await loginApi(credentials);
});

export const verifyToken = createAsyncThunk(
  "auth/verifyToken",
  async (token) => {
    return await verifyTokenApi(token);
  },
);
