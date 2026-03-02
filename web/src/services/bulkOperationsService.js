import axios from "axios";

const BASE_URL = "/api/v1/admin/bulk-operations";

export async function bulkPriceUpdate(products, updateType, value) {
  try {
    const response = await axios.post(`${BASE_URL}/price-update`, {
      products,
      updateType,
      value,
    });
    return response.data;
  } catch (error) {
    console.error("Error bulk updating prices:", error);
    throw error;
  }
}

export async function bulkStockUpdate(updates) {
  try {
    const response = await axios.post(`${BASE_URL}/stock-update`, {
      updates,
    });
    return response.data;
  } catch (error) {
    console.error("Error bulk updating stock:", error);
    throw error;
  }
}

export async function bulkCategoryAssignment(products, categoryId) {
  try {
    const response = await axios.post(`${BASE_URL}/category-assignment`, {
      products,
      categoryId,
    });
    return response.data;
  } catch (error) {
    console.error("Error bulk assigning category:", error);
    throw error;
  }
}

export async function bulkDelete(products) {
  try {
    const response = await axios.post(`${BASE_URL}/delete`, {
      products,
    });
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
