import axios from "axios";
import { API_URL } from "../constants/config";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const checkout = async (data) => {
  if (!data) throw new Error("empty cart");
  console.log("CHECKOUT SNAPSHOT:", data);
  console.log(`${API_URL}api/v1/checkout`);
  const token = await AsyncStorage.getItem("token")
  const result = await axios.post(`${API_URL}api/v1/checkout`, data, {
    headers: {
      "Content-Type": "application/json",
        "Authorization":`Bearer ${token}`
    },
  });

  const queueId = result.data.result;
  return queueId;
};
