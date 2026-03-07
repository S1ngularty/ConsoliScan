import axios from "axios";

axios.defaults.baseURL = import.meta.env.VITE_APP_API;

const BASE_URL = "/api/v1/admin/bulk-operations";

export async function bulkPriceUpdate(data) {
  try {
    const response = await axios.post(`${BASE_URL}/price-update`, data);
    return response.data;
  } catch (error) {
    console.error("Error bulk updating prices:", error);
    throw error;
  }
}

export async function bulkStockUpdate(data) {
  try {
    const response = await axios.post(`${BASE_URL}/stock-update`, data);
    return response.data;
  } catch (error) {
    console.error("Error bulk updating stock:", error);
    throw error;
  }
}

export async function bulkCategoryAssignment(data) {
  try {
    const response = await axios.post(`${BASE_URL}/category-assignment`, data);
    return response.data;
  } catch (error) {
    console.error("Error bulk assigning category:", error);
    throw error;
  }
}

export async function bulkDelete(data) {
  try {
    const response = await axios.post(`${BASE_URL}/delete`, data);
    return response.data;
  } catch (error) {
    console.error("Error bulk deleting products:", error);
    throw error;
  }
}

export async function exportProducts() {
  try {
    const response = await axios.get(`${BASE_URL}/export`, {
      responseType: "blob",
    });
    return response.data;
  } catch (error) {
    console.error("Error exporting products:", error);
    throw error;
  }
}

export async function importProducts(products) {
  try {
    const response = await axios.post(`${BASE_URL}/import`, {
      products,
    });
    return response.data;
  } catch (error) {
    console.error("Error importing products:", error);
    throw error;
  }
}
