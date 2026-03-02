import axios from "axios";

const BASE_URL = "/api/v1/admin/suppliers";

export async function createSupplier(supplierData) {
  try {
    const response = await axios.post(BASE_URL, supplierData);
    return response.data;
  } catch (error) {
    console.error("Error creating supplier:", error);
    throw error;
  }
}

export async function getAllSuppliers(params = {}) {
  try {
    const response = await axios.get(BASE_URL, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    throw error;
  }
}

export async function getSupplierById(id) {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching supplier:", error);
    throw error;
  }
}

export async function updateSupplier(id, supplierData) {
  try {
    const response = await axios.put(`${BASE_URL}/${id}`, supplierData);
    return response.data;
  } catch (error) {
    console.error("Error updating supplier:", error);
    throw error;
  }
}

export async function deleteSupplier(id) {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting supplier:", error);
    throw error;
  }
}

export async function getSupplierAnalytics() {
  try {
    const response = await axios.get(`${BASE_URL}/analytics`);
    return response.data;
  } catch (error) {
    console.error("Error fetching supplier analytics:", error);
    throw error;
  }
}
