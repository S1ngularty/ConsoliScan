// api/cashier.api.js
import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";
import {
  apiFetch,
  handleApiError,
  markServerUp,
} from "../utils/apiErrorHandler";

// Create axios instance with base configuration
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 second timeout for all requests
});

// Add auth token to all requests
axiosInstance.interceptors.request.use(async (config) => {
  const token = await getToken();
  config.headers.Authorization = `Bearer ${token}`;
  console.log("Axios request:", config.method.toUpperCase(), config.url);
  return config;
});

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("Axios response:", response.status, response.config.url);
    markServerUp();
    return response;
  },
  (error) => {
    console.error("Axios error:", error.message);
    console.error("Error config:", error.config?.url);
    console.error("Error response:", error.response?.data);
    return Promise.reject(handleApiError(error));
  },
);

/**
 * Get cashier dashboard statistics
 * @returns {Object} Dashboard stats including today's sales, revenue, transactions
 */
export const getDashboardStats = async () => {
  const response = await axiosInstance.get("api/v1/cashier/dashboard");
  return response.data.result;
};

/**
 * Get recent transactions for cashier
 * @param {number} limit - Number of transactions to fetch (default: 10)
 * @returns {Object} Recent transactions list
 */
export const getRecentTransactions = async (limit = 10) => {
  const response = await axiosInstance.get(
    `api/v1/cashier/recent-transactions?limit=${limit}`,
  );
  return response.data.result;
};

/**
 * Get pending checkout queues
 * @returns {Object} List of pending checkout queues
 */
export const getPendingQueues = async () => {
  const response = await axiosInstance.get("api/v1/cashier/pending-queues");
  return response.data.result;
};

/**
 * Get recent exchanges handled by cashier
 * @param {number} limit - Number of exchanges to fetch (default: 5)
 * @returns {Object} Recent exchanges list
 */
export const getRecentExchanges = async (limit = 5) => {
  const response = await axiosInstance.get(
    `api/v1/cashier/recent-exchanges?limit=${limit}`,
  );
  return response.data.result;
};

/**
 * Get inventory list with search and filters
 * @param {Object} params - Query parameters (search, category, lowStock, page, limit)
 * @returns {Object} Inventory list with pagination
 */
export const getInventory = async (params = {}) => {
  console.log("=== getInventory API called ===");
  console.log("Original params:", params);

  // Filter out undefined/null values
  const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      acc[key] = value;
    }
    return acc;
  }, {});

  console.log("Clean params:", cleanParams);

  const queryString = new URLSearchParams(cleanParams).toString();
  console.log("Query string:", queryString);

  const url = `api/v1/cashier/inventory${queryString ? `?${queryString}` : ""}`;
  console.log("Full URL:", url);

  const response = await axiosInstance.get(url);
  console.log("Response data:", response.data);
  console.log("Returning:", response.data.result);
  return response.data.result;
};

/**
 * Update product stock quantity
 * @param {string} productId - Product ID
 * @param {Object} data - { quantity, action } where action is 'add', 'subtract', or 'set'
 * @returns {Object} Updated product info
 */
export const updateStock = async (productId, data) => {
  const response = await axiosInstance.patch(
    `api/v1/cashier/inventory/${productId}/stock`,
    data,
  );
  return response.data.result;
};

/**
 * Get sales reports
 * @param {Object} params - { period, startDate, endDate }
 * @returns {Object} Sales report data
 */
export const getSalesReports = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(
    `api/v1/cashier/reports${queryString ? `?${queryString}` : ""}`,
  );
  return response.data.result;
};

/**
 * Get transaction history
 * @param {Object} params - Query parameters (page, limit, startDate, endDate, paymentMethod)
 * @returns {Object} Transaction history with pagination
 */
export const getTransactionHistory = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await axiosInstance.get(
    `api/v1/cashier/transactions${queryString ? `?${queryString}` : ""}`,
  );
  return response.data.result;
};

/**
 * Get low stock alerts
 * @param {number} threshold - Stock threshold (default: 10)
 * @returns {Object} Low stock products list
 */
export const getLowStockAlerts = async (threshold = 10) => {
  const response = await axiosInstance.get(
    `api/v1/cashier/low-stock-alerts?threshold=${threshold}`,
  );
  return response.data.result;
};

/**
 * Get cashier profile with statistics
 * @returns {Object} Profile data and performance stats
 */
export const getProfile = async () => {
  const response = await axiosInstance.get("api/v1/cashier/profile");
  return response.data.result;
};

/**
 * Update cashier profile
 * @param {Object} data - Profile data (name, email, contactNumber, address, avatar)
 * @returns {Object} Updated profile
 */
export const updateProfile = async (data) => {
  const token = await getToken();
  if (!token) throw new Error("No token available");

  const formData = new FormData();

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue;

    // Handle avatar image upload
    if (key === "avatar" && typeof value === "object" && value.uri) {
      formData.append("avatar", {
        uri: value.uri,
        name: value.name || "avatar.jpg",
        type: value.type || "image/jpeg",
      });
    } else if (typeof value !== "object") {
      formData.append(key, String(value));
    }
  }

  const response = await apiFetch(`${API_URL}api/v1/cashier/profile`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  const result = await response.json();
  return result.result;
};
