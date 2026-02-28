// api/return.api.js
import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";
import {
  apiFetch,
  handleApiError,
  markServerUp,
} from "../utils/apiErrorHandler";

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
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

/**
 * Initiate a return for an item
 * @param {Object} returnData - { orderId, itemId, returnReason, returnReasonNotes }
 * @returns {Promise<Object>} Return data with _id, qrToken, status
 */
export const initiateReturn = async (returnData) => {
  const response = await axiosInstance.post(
    "api/v1/returns/initiate",
    returnData,
  );
  return response.data.result;
};

/**
 * Get return status by ID
 * @param {string} returnId
 * @returns {Promise<Object>} Return status data
 */
export const getReturnStatus = async (returnId) => {
  const response = await axiosInstance.get(`api/v1/returns/${returnId}`);
  return response.data.result;
};

/**
 * Get all returns for the logged-in customer
 * @returns {Promise<Array>} List of returns
 */
export const getCustomerReturns = async () => {
  const response = await axiosInstance.get("api/v1/returns");
  return response.data.result;
};

/**
 * Cancel a pending return
 * @param {string} returnId
 * @returns {Promise<Object>} Cancelled return data
 */
export const cancelReturn = async (returnId) => {
  const response = await axiosInstance.patch(
    `api/v1/returns/${returnId}/cancel`,
  );
  return response.data.result;
};

/**
 * Complete return with loyalty points conversion
 * @param {string} returnId
 * @param {Object} data - { loyaltyAmount }
 * @returns {Promise<Object>} Completed return data
 */
export const completeLoyaltyConversion = async (returnId, data) => {
  const response = await axiosInstance.post(
    `api/v1/returns/${returnId}/complete-loyalty`,
    data,
  );
  return response.data.result;
};

/**
 * Complete return with item swap
 * @param {string} returnId
 * @param {Object} data - { replacementBarcode }
 * @returns {Promise<Object>} Completed return data
 */
export const completeItemSwap = async (returnId, data) => {
  const response = await axiosInstance.post(
    `api/v1/returns/${returnId}/complete-swap`,
    data,
  );
  return response.data.result;
};

// ========== CASHIER APIs ==========

/**
 * Validate return QR code or checkout code (Cashier)
 * @param {Object} data - { qrToken, checkoutCode }
 * @returns {Promise<Object>} Return data with customer and item info
 */
export const validateReturnQR = async (data) => {
  const response = await axiosInstance.post("api/v1/returns/validate-qr", data);
  return response.data.result;
};

/**
 * Complete inspection (Cashier)
 * @param {string} returnId
 * @param {Object} data - { inspectionStatus: "PASSED" | "REJECTED", inspectionNotes }
 * @returns {Promise<Object>} Updated return data
 */
export const completeInspection = async (returnId, data) => {
  const response = await axiosInstance.post(
    `api/v1/returns/${returnId}/inspect`,
    data,
  );
  return response.data.result;
};
