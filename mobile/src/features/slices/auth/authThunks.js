import { createAsyncThunk } from "@reduxjs/toolkit";
import { loginApi, registerApi, verifyTokenApi } from "./authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const login = createAsyncThunk("auth/login", async (credentials) => {
  return await loginApi(credentials);
});

export const verifyToken = createAsyncThunk(
  "auth/verifyToken",
  async (token) => {
    return await verifyTokenApi(token);
  },
);

export const register = createAsyncThunk("auth/register", async (userData) => {
  return await registerApi(userData);
});

export const logout = createAsyncThunk("auth/logout", async () => {
  return await AsyncStorage.setItem("token", "");
});
