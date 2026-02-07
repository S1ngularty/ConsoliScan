import axios from "axios";
import { API_URL } from "../constants/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const syncCartApi = async (cart) => {
  if (!cart) throw new Error("empty cart");
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("missing token");

  const result = await axios
    .post(`${API_URL}api/v1/cart/syncCart`, cart, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
    .catch((error) => {
      console.error(error);
      throw new Error(error);
    });

  return result.data.success;
};

export const getCart = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) return;

  const result = await axios.get(`${API_URL}api/v1/cart`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  // console.log(result.data.result);
  return result.data.result;
};

export const clearCart = async () => {
  const token = await AsyncStorage.getItem("token");
  if (!token) throw new Error("unauthorize request");
  const result = await axios.delete(`${API_URL}api/v1/cart`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return
};
