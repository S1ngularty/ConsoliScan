import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_APP_API;

/**
 * Get all orders for admin with filtering and pagination
 * @param {Object} params - Query parameters
 * @param {string} params.status - Filter by order status (CONFIRMED, CANCELLED, REFUNDED)
 * @param {string} params.customerType - Filter by customer type (senior, pwd, regular, none)
 * @param {string} params.startDate - Filter orders from this date
 * @param {string} params.endDate - Filter orders until this date
 * @param {string} params.search - Search by checkout code
 * @param {number} params.page - Page number (default: 1)
 * @param {number} params.limit - Items per page (default: 50)
 * @param {string} params.sortBy - Sort field (default: confirmedAt)
 * @param {string} params.sortOrder - Sort direction (asc/desc, default: desc)
 * @returns {Promise<Object>} Orders with pagination info
 */
export async function getAllOrders(params = {}) {
  try {
    const response = await axios.get("/api/v1/admin/orders", {
      params: {
        status: params.status,
        customerType: params.customerType,
        startDate: params.startDate,
        endDate: params.endDate,
        search: params.search,
        page: params.page || 1,
        limit: params.limit || 50,
        sortBy: params.sortBy || "confirmedAt",
        sortOrder: params.sortOrder || "desc",
      },
    });

    return response.data?.result || response.data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
}

/**
 * Get user's own orders (customer view)
 * @returns {Promise<Array>} User's order list
 */
export async function getUserOrders() {
  try {
    const response = await axios.get("/api/v1/orders");
    return response.data?.result || response.data;
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
}

/**
 * Download receipt for an order
 * @param {string} orderId - Order ID
 * @param {string} checkoutCode - Checkout code
 * @returns {Promise<Blob>} PDF blob
 */
export async function downloadReceipt(orderId, checkoutCode) {
  try {
    const response = await axios.get(`/api/v1/receipts/generate/${orderId}`, {
      params: { checkoutCode },
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Error downloading receipt:", error);
    throw error;
  }
}
