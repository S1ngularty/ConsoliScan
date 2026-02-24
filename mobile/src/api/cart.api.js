import axios from "axios";
import { API_URL } from "../constants/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const syncCartApi = async (cart) => {
  if (!cart) throw new Error("empty cart");
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("missing token");

  try {
    const result = await axios.post(`${API_URL}api/v1/cart/syncCart`, cart, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      timeout: 15000, // 15 second timeout
    });
    return result.data.success;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout - server is taking too long to respond");
    } else if (
      error.message === "Network Error" ||
      error.code === "ERR_NETWORK"
    ) {
      throw new Error("Cannot reach server - please check your connection");
    }
    throw new Error(error.message || "Failed to sync cart");
  }
};

export const getCart = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) return;

  try {
    const result = await axios.get(`${API_URL}api/v1/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000, // 10 second timeout
    });
    return result.data.result;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout - server is taking too long to respond");
    } else if (
      error.message === "Network Error" ||
      error.code === "ERR_NETWORK"
    ) {
      throw new Error("Cannot reach server - please check your connection");
    }
    throw new Error(error.message || "Failed to fetch cart");
  }
};

export const clearCart = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("unauthorize request");

  try {
    const result = await axios.delete(`${API_URL}api/v1/cart`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 10000, // 10 second timeout
    });
    return result.data;
  } catch (error) {
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout - server is taking too long to respond");
    } else if (
      error.message === "Network Error" ||
      error.code === "ERR_NETWORK"
    ) {
      throw new Error("Cannot reach server - please check your connection");
    }
    throw new Error(error.message || "Failed to clear cart");
  }
};
