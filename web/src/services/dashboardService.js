import axios from "axios";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_APP_API;
axios.defaults.headers.post["Content-Type"] = "application/json";

const normalizeDataArray = (payload) => {
  const result = payload?.result;
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

// Get dashboard summary
export async function getDashboardSummary() {
  try {
    const response = await axios.get("/api/v1/admin/dashboard/summary", {
      headers: {
        "Cache-Control": "no-cache",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard summary:", error);
    throw error;
  }
}

// Get sales analytics
export async function getSalesAnalytics(params = {}) {
  try {
    const { startDate, endDate, groupBy = "day" } = params;
    const response = await axios.get("/api/v1/admin/analytics/sales", {
      params: {
        startDate,
        endDate,
        groupBy,
      },
    });
    const dataArray = normalizeDataArray(response.data);
    return {
      ...response.data,
      data: dataArray, // Flatten the nested data array to top level
    };
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    console.error("Error response:", error.response?.data);
    throw error;
  }
}

// Get product analytics
export async function getProductAnalytics(params = {}) {
  try {
    const { limit = 10, sortBy = "sales", startDate, endDate } = params;
    const response = await axios.get("/api/v1/admin/analytics/products", {
      params: {
        limit,
        sortBy,
        startDate,
        endDate,
      },
    });
    const dataArray = normalizeDataArray(response.data);
    return {
      ...response.data,
      data: dataArray,
    };
  } catch (error) {
    console.error("Error fetching product analytics:", error);
    throw error;
  }
}

// Get category analytics
export async function getCategoryAnalytics(params = {}) {
  try {
    const { startDate, endDate } = params;
    const response = await axios.get("/api/v1/admin/analytics/categories", {
      params: {
        startDate,
        endDate,
      },
    });
    const dataArray = normalizeDataArray(response.data);
    return {
      ...response.data,
      data: dataArray,
    };
  } catch (error) {
    console.error("Error fetching category analytics:", error);
    throw error;
  }
}

// Get user analytics
export async function getUserAnalytics(params = {}) {
  try {
    const { startDate, endDate } = params;
    const response = await axios.get("/api/v1/admin/analytics/users", {
      params: {
        startDate,
        endDate,
      },
    });
    const dataArray = normalizeDataArray(response.data);
    return {
      ...response.data,
      data: dataArray,
    };
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    throw error;
  }
}

// Get order analytics
export async function getOrderAnalytics(params = {}) {
  try {
    const { startDate, endDate } = params;
    const response = await axios.get("/api/v1/admin/analytics/orders", {
      params: {
        startDate,
        endDate,
      },
    });
    const dataArray = normalizeDataArray(response.data);
    return {
      ...response.data,
      data: dataArray,
    };
  } catch (error) {
    console.error("Error fetching order analytics:", error);
    throw error;
  }
}

// Get inventory analytics
export async function getInventoryAnalytics() {
  try {
    const response = await axios.get("/api/v1/admin/analytics/inventory");
    const dataArray = normalizeDataArray(response.data);
    return {
      ...response.data,
      data: dataArray,
    };
  } catch (error) {
    console.error("Error fetching inventory analytics:", error);
    throw error;
  }
}

// Get promotion analytics
export async function getPromotionAnalytics(params = {}) {
  try {
    const { startDate, endDate } = params;
    const response = await axios.get("/api/v1/admin/analytics/promotions", {
      params: {
        startDate,
        endDate,
      },
    });
    const dataArray = normalizeDataArray(response.data);
    return {
      ...response.data,
      data: dataArray,
    };
  } catch (error) {
    console.error("Error fetching promotion analytics:", error);
    throw error;
  }
}

// Get activity logs
export async function getActivityLogs(params = {}) {
  try {
    const { limit = 10, page = 1, userId, action, status } = params;
    const response = await axios.get("/api/v1/admin/activity-logs", {
      params: {
        limit,
        page,
        userId,
        action,
        status,
      },
    });
    const dataArray = normalizeDataArray(response.data);
    return {
      ...response.data,
      data: dataArray,
    };
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    throw error;
  }
}

// Get returns report data
export async function getReturnsReport(params = {}) {
  try {
    const { startDate, endDate } = params;
    const response = await axios.get("/api/v1/admin/analytics/returns", {
      params: {
        startDate,
        endDate,
      },
    });

    return {
      ...response.data,
      data: response.data?.result?.data || [],
    };
  } catch (error) {
    console.error("Error fetching returns report:", error);
    throw error;
  }
}
