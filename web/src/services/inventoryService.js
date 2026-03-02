import axios from "axios";

// ══════════════════════════════════════════════════════
//  STOCK MOVEMENTS
// ══════════════════════════════════════════════════════
export async function getStockMovements(params = {}) {
  try {
    const response = await axios.get("/api/v1/admin/stock-movements", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    throw error;
  }
}

export async function getProductStockHistory(productId, days = 30) {
  try {
    const response = await axios.get(
      `/api/v1/admin/stock-movements/product/${productId}`,
      {
        params: { days },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching product stock history:", error);
    throw error;
  }
}

export async function getStockAnalytics(timeRange = 30) {
  try {
    const response = await axios.get(
      "/api/v1/admin/stock-movements/analytics",
      {
        params: { timeRange },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching stock analytics:", error);
    throw error;
  }
}

export async function adjustStock(productId, quantity, reason) {
  try {
    const response = await axios.post(
      `/api/v1/admin/stock-movements/adjust/${productId}`,
      {
        quantity,
        reason,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error adjusting stock:", error);
    throw error;
  }
}

// ══════════════════════════════════════════════════════
//  PURCHASE ORDERS
// ══════════════════════════════════════════════════════
export async function createPurchaseOrder(poData) {
  try {
    const response = await axios.post("/api/v1/admin/purchase-orders", poData);
    return response.data;
  } catch (error) {
    console.error("Error creating purchase order:", error);
    throw error;
  }
}

export async function getAllPurchaseOrders(params = {}) {
  try {
    const response = await axios.get("/api/v1/admin/purchase-orders", {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    throw error;
  }
}

export async function getPurchaseOrderById(id) {
  try {
    const response = await axios.get(`/api/v1/admin/purchase-orders/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    throw error;
  }
}

export async function updatePurchaseOrder(id, poData) {
  try {
    const response = await axios.put(
      `/api/v1/admin/purchase-orders/${id}`,
      poData,
    );
    return response.data;
  } catch (error) {
    console.error("Error updating purchase order:", error);
    throw error;
  }
}

export async function receivePurchaseOrder(id, receivedItems) {
  try {
    const response = await axios.post(
      `/api/v1/admin/purchase-orders/${id}/receive`,
      {
        receivedItems,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error receiving purchase order:", error);
    throw error;
  }
}

export async function deletePurchaseOrder(id) {
  try {
    const response = await axios.delete(`/api/v1/admin/purchase-orders/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    throw error;
  }
}

export async function getPurchaseOrderAnalytics(timeRange = 30) {
  try {
    const response = await axios.get(
      "/api/v1/admin/purchase-orders/analytics",
      {
        params: { timeRange },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching purchase order analytics:", error);
    throw error;
  }
}
