import { createAsyncThunk } from "@reduxjs/toolkit";
import { loginApi, registerApi, verifyTokenApi } from "./authService";
import AsyncStorage from "@react-native-async-storage/async-storage";

function getApiErrorMessage(error, fallbackMessage) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallbackMessage
  );
}

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      return await loginApi(credentials);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Login failed"));
    }
  },
);

export const verifyToken = createAsyncThunk(
  "auth/verifyToken",
  async (token, { rejectWithValue }) => {
    try {
      return await verifyTokenApi(token);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Token verification failed"),
      );
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      return await registerApi(userData);
    } catch (error) {
      return rejectWithValue(getApiErrorMessage(error, "Registration failed"));
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  await AsyncStorage.setItem("user", "");
  await AsyncStorage.setItem("eligibilityStatus", "");
  await AsyncStorage.setItem("token", "");
  return null;
});
