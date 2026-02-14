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
    const response = await axiosInstance.get("api/v1/loyalty/config", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(response.data.result);
    return response.data.result;
  },
};

export const getConfig = loyaltyApi.getConfig;
