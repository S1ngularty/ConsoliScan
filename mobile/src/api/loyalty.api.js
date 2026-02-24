import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const loyaltyApi = {
  getConfig: async () => {
    const token = await getToken();
    try {
      const response = await axiosInstance.get("api/v1/loyalty/config", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000, // 10 second timeout
      });
      console.log(response.data.result);
      return response.data.result;
    } catch (error) {
      if (error.code === "ECONNABORTED") {
        throw new Error(
          "Request timeout - server is taking too long to respond",
        );
      } else if (
        error.message === "Network Error" ||
        error.code === "ERR_NETWORK"
      ) {
        throw new Error("Cannot reach server - please check your connection");
      }
      throw new Error(error.message || "Failed to fetch loyalty config");
    }
  },
};

export const getConfig = loyaltyApi.getConfig;
