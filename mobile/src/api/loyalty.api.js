import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";
import { handleApiError, markServerUp } from "../utils/apiErrorHandler";

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
      markServerUp();
      return response.data.result;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export const getConfig = loyaltyApi.getConfig;
