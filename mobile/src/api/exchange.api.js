// api/exchange.api.js
import axios from "axios";
import { API_URL } from "../constants/config";
import { getToken } from "../utils/authUtil";

// Exact same axiosInstance pattern as order.api.js
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

/**
 * Customer: Initiate an exchange for an order item.
 * Returns the signed QR token to display.
 * @param {string} orderId
 * @param {string} itemId  – item.product or item._id from the order
 */
export const initiateExchange = async (orderId, itemId) => {
  const response = await axiosInstance.post("api/v1/exchanges/initiate", {
    orderId,
    itemId,
  });
  // { success, exchangeId, qrToken, status, expiresAt, price, itemName }
  return response.data;
};

/**
 * Customer: Get a single exchange's current status.
 * Used for polling while waiting at the cashier.
 * @param {string} exchangeId
 */
export const getExchangeStatus = async (exchangeId) => {
  const response = await axiosInstance.get(`api/v1/exchanges/${exchangeId}`);
  return response.data;
};

/**
 * Customer: Fetch all exchanges for the logged-in user.
 */
export const listExchanges = async () => {
  const response = await axiosInstance.get("api/v1/exchanges");
  return response.data;
};

/**
 * Customer: Cancel a pending/validated exchange.
 * @param {string} exchangeId
 */
export const cancelExchange = async (exchangeId) => {
  const response = await axiosInstance.patch(
    `api/v1/exchanges/${exchangeId}/cancel`,
    {},
  );
  return response.data;
};

/**
 * Cashier: Validate exchange QR code and verify item condition.
 * @param {string} qrToken - signed JWT from customer QR
 */
export const validateExchangeQR = async (qrToken) => {
  const response = await axiosInstance.post("api/v1/exchanges/validate-qr", {
    qrToken,
  });
  // { success, exchangeId, status, price, order, item }
  return response.data;
};

/**
 * Cashier: Complete the exchange - scan replacement barcode.
 * @param {string} exchangeId
 * @param {string} replacementBarcode
 */
export const completeExchange = async (exchangeId, replacementBarcode) => {
  const response = await axiosInstance.post(
    `api/v1/exchanges/${exchangeId}/complete`,
    { replacementBarcode },
  );
  // { success, exchangeId, status, blockchainTxId, replacement }
  return response.data;
};

/**
 * Customer: Verify if scanned product matches the exchange price.
 * @param {string} exchangeId
 * @param {string} barcode - scanned product barcode
 */
export const verifyReplacementPrice = async (exchangeId, barcode) => {
  const response = await axiosInstance.post(
    `api/v1/exchanges/${exchangeId}/verify-replacement`,
    { barcode },
  );
  // { success, isValid, product, message }
  return response.data;
};
