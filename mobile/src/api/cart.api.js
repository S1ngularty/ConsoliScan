import axios from "axios";
import { API_URL } from "../constants/config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { handleApiError, markServerUp } from "../utils/apiErrorHandler";

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
    markServerUp();
    return result.data.success;
  } catch (error) {
    throw handleApiError(error);
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
    markServerUp();
    return result.data.result;
  } catch (error) {
    throw handleApiError(error);
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
    markServerUp();
    return result.data;
  } catch (error) {
    throw handleApiError(error);
  }
};
