import axios from "axios";

const BASE_URL = "/api/v1/admin/expenses";

// ══════════════════════════════════════════════════════
//  EXPENSE CRUD
// ══════════════════════════════════════════════════════
export async function createExpense(expenseData) {
  try {
    const response = await axios.post(BASE_URL, expenseData);
    return response.data;
  } catch (error) {
    console.error("Error creating expense:", error);
    throw error;
  }
}

export async function getAllExpenses(params = {}) {
  try {
    const response = await axios.get(BASE_URL, { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching expenses:", error);
    throw error;
  }
}

export async function getExpenseById(id) {
  try {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching expense:", error);
    throw error;
  }
}

export async function updateExpense(id, expenseData) {
  try {
    const response = await axios.put(`${BASE_URL}/${id}`, expenseData);
    return response.data;
  } catch (error) {
    console.error("Error updating expense:", error);
    throw error;
  }
}

export async function deleteExpense(id) {
  try {
    const response = await axios.delete(`${BASE_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting expense:", error);
    throw error;
  }
}

export async function getExpenseAnalytics(timeRange = 30) {
  try {
    const response = await axios.get(`${BASE_URL}/analytics`, {
      params: { timeRange },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching expense analytics:", error);
    throw error;
  }
}
