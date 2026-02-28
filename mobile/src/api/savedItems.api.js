import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";
import { handleApiError, markServerUp } from "../utils/apiErrorHandler";
/**
 * Get all saved items for the authenticated user
 */

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(async (config) => {
  const token = await getToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => {
    markServerUp();
    return response;
  },
  (error) => Promise.reject(handleApiError(error)),
);

export const getSavedItems = async () => {
  try {
    const response = await axiosInstance.get(`api/v1/saved-items`);
    return response.data.result;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Add a product to saved items
 * @param {string} productId - Product ID to save
 */
export const addToSaved = async (productId) => {
  try {
    const response = await axiosInstance.post(`api/v1/saved-items/add`, {
      productId,
    });
    return response.data.result;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Remove a product from saved items
 * @param {string} productId - Product ID to remove
 */
export const removeFromSaved = async (productId) => {
  try {
    const response = await axiosInstance.post(`api/v1/saved-items/remove`, {
      productId,
    });
    return response.data.result;
  } catch (error) {
    throw handleApiError(error);
  }
};

/**
 * Check if a product is in user's saved items
 * @param {string} productId - Product ID to check
 */
export const checkIsSaved = async (productId) => {
  try {
    const response = await axiosInstance.get(
      `api/v1/saved-items/check/${productId}`,
    );
    return response.data.result;
  } catch (error) {
    throw handleApiError(error);
  }
};
