// src/services/loyaltyService.js
import axios from "axios";

const API_URL = import.meta.env.VITE_APP_API;

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// // Add token to requests if available
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

export const loyaltyService = {
  // Get loyalty configuration
  getLoyaltyConfig: async () => {
    try {
      const response = await axiosInstance.get("/api/v1/loyalty/config");
      return response.data?.result;
    } catch (error) {
      // If 404, return default config
      if (error.response?.status === 404) {
        return {
          pointsToCurrencyRate: 1, // Default: 1 point = 1 Peso (Aligned with mobile)
          maxRedeemPercent: 20,
          earnRate: 1,
          enabled: true,
        };
      }
      throw error.response?.data || error;
    }
  },

  // Update loyalty configuration
  updateLoyaltyConfig: async (configData) => {
    try {
      const response = await axiosInstance.put(
        "/api/v1/loyalty/config",
        configData,
      );
      return response.data?.result;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Reset all customer points
  resetLoyaltyPoints: async () => {
    try {
      const response = await axiosInstance.post("/api/v1/loyalty/reset-points");
      return response.data?.result;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateLoyaltyProgramStatus: async (status) => {
    try {
      // Fixed: Use axiosInstance to ensure correct baseURL
      const response = await axiosInstance.put("/api/v1/loyalty/config/status", {
        enabled: status,
      });

      return response.data?.result;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get loyalty statistics
  getLoyaltyStats: async () => {
    try {
      const response = await axiosInstance.get("/loyalty/stats");
      return response.data?.result;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get customer loyalty points
  getCustomerPoints: async (customerId) => {
    try {
      const response = await axiosInstance.get(
        `/loyalty/customers/${customerId}/points`,
      );
      return response.data?.result;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Adjust customer points (admin only)
  adjustCustomerPoints: async (customerId, points, reason) => {
    try {
      const response = await axiosInstance.post(
        `/loyalty/customers/${customerId}/adjust`,
        {
          points,
          reason,
        },
      );
      return response.data?.result;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};

// For backward compatibility
export const getLoyaltyConfig = loyaltyService.getLoyaltyConfig;
export const updateLoyaltyConfig = loyaltyService.updateLoyaltyConfig;
export const resetLoyaltyPoints = loyaltyService.resetLoyaltyPoints;
export const updateLoyaltyProgramStatus =
  loyaltyService.updateLoyaltyProgramStatus;
export const getLoyaltyStats = loyaltyService.getLoyaltyStats;
export const getCustomerPoints = loyaltyService.getCustomerPoints;
export const adjustCustomerPoints = loyaltyService.adjustCustomerPoints;
