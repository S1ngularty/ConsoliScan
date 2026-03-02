import axios from "axios";

const BASE_URL = "/api/v1/admin/settings";

export async function getSettings() {
  try {
    const response = await axios.get(BASE_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching settings:", error);
    throw error;
  }
}

export async function updateSettings(settingsData) {
  try {
    const response = await axios.put(BASE_URL, settingsData);
    return response.data;
  } catch (error) {
    console.error("Error updating settings:", error);
    throw error;
  }
}

export async function updateBusinessHours(businessHours) {
  try {
    const response = await axios.put(
      `${BASE_URL}/business-hours`,
      businessHours,
    );
    return response.data;
  } catch (error) {
    console.error("Error updating business hours:", error);
    throw error;
  }
}

export async function updateReceiptSettings(receiptSettings) {
  try {
    const response = await axios.put(`${BASE_URL}/receipt`, receiptSettings);
    return response.data;
  } catch (error) {
    console.error("Error updating receipt settings:", error);
    throw error;
  }
}

export async function updateTaxSettings(taxSettings) {
  try {
    const response = await axios.put(`${BASE_URL}/tax`, taxSettings);
    return response.data;
  } catch (error) {
    console.error("Error updating tax settings:", error);
    throw error;
  }
}
